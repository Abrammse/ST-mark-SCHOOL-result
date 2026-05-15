// ===== Student Results App =====
let studentsData = null;

// Normalize Arabic text for better matching
function normalizeArabic(text) {
    if (!text) return '';
    return text
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/[ؤ]/g, 'و')
        .replace(/[ئ]/g, 'ي')
        .replace(/[ى]/g, 'ي')
        .replace(/[ة]/g, 'ه')
        .replace(/[ً-ْ]/g, '')  // Remove tashkeel
        .replace(/\s+/g, ' ')
        .trim();
}

// Grade styling helpers
function getGradeClass(grade) {
    if (!grade) return 'text-slate-400';
    if (grade.includes('ممتاز')) return 'text-emerald-600';
    if (grade.includes('جيد جداً') || grade.includes('جيد جدا')) return 'text-blue-600';
    if (grade.includes('جيد')) return 'text-indigo-600';
    if (grade.includes('مقبول')) return 'text-amber-600';
    return 'text-rose-600';
}

function getGradeBadgeClass(grade) {
    if (!grade) return 'bg-slate-100 text-slate-400';
    if (grade.includes('ممتاز')) return 'bg-emerald-50 text-emerald-700';
    if (grade.includes('جيد جداً')) return 'bg-blue-50 text-blue-700';
    return 'bg-gold-50 text-gold-700';
}

function getGradeColor(grade) {
    if (!grade) return '#94a3b8';
    if (grade.includes('ممتاز')) return '#059669';
    if (grade.includes('جيد جداً') || grade.includes('جيد جدا')) return '#2563eb';
    if (grade.includes('جيد')) return '#4f46e5';
    if (grade.includes('مقبول')) return '#d97706';
    return '#dc2626';
}

// Load data from global variable
async function loadData() {
    if (window.ALL_STUDENTS_DATA) {
        studentsData = window.ALL_STUDENTS_DATA;
        updateTitle();
        renderTopStudents();
        console.log("Data loaded from js/data.js");
    } else {
        console.error("Data not found in window.ALL_STUDENTS_DATA");
    }
}

function updateTitle() {
    if (studentsData && studentsData.title) {
        const el = document.getElementById('result-title');
        if (el) el.textContent = studentsData.title;
    }
}

// Render Top 5 Students per Stage
function renderTopStudents() {
    try {
        const grid = document.getElementById('topStudentsGrid');
        if (!grid || !studentsData) return;

        grid.innerHTML = studentsData.classes.map(cls => {
            const top5 = [...cls.students]
                .sort((a, b) => (b.total || 0) - (a.total || 0))
                .slice(0, 5);

            const totalMax = (cls.maxScores && Array.isArray(cls.maxScores)) 
                ? cls.maxScores.reduce((a, b) => a + b, 0) 
                : 100;

            return `
                <div class="bg-white/60 backdrop-blur-xl rounded-[2rem] p-8 border border-white shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                    <div class="flex items-center justify-between mb-6">
                        <h4 class="text-xl font-black text-slate-900">فصل ${cls.name}</h4>
                        <span class="px-3 py-1 rounded-full bg-gold-100 text-gold-600 text-[10px] font-black uppercase">Top 5</span>
                    </div>
                    <div class="space-y-4">
                        ${top5.map((s, idx) => `
                            <div class="flex items-center gap-4 group">
                                <div class="w-8 h-8 rounded-full ${idx === 0 ? 'bg-gold-500 text-white' : 'bg-slate-100 text-slate-400'} flex items-center justify-center font-black text-xs shadow-sm">
                                    ${idx + 1}
                                </div>
                                <div class="flex-1">
                                    <p class="text-sm font-bold text-slate-800 group-hover:text-gold-600 transition-colors">${s.name}</p>
                                    <div class="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                        <div class="h-full bg-gold-500/30" style="width: ${totalMax > 0 ? (s.total / totalMax) * 100 : 0}%"></div>
                                    </div>
                                </div>
                                <p class="font-outfit font-black text-gold-600 text-xs">${s.total}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error("Error rendering top students:", e);
    }
}

// Search students
function searchStudents(query) {
    if (!studentsData || !query || query.length < 2) return [];
    const normalizedQuery = normalizeArabic(query);
    const results = [];

    studentsData.classes.forEach(cls => {
        cls.students.forEach(student => {
            const normalizedName = normalizeArabic(student.name);
            let score = 0;
            if (normalizedName === normalizedQuery) score = 100;
            else if (normalizedName.startsWith(normalizedQuery)) score = 80;
            else if (normalizedName.includes(normalizedQuery)) score = 60;
            else {
                const queryWords = normalizedQuery.split(' ');
                const nameWords = normalizedName.split(' ');
                const matched = queryWords.filter(qw => nameWords.some(nw => nw.includes(qw)));
                if (matched.length > 0) score = (matched.length / queryWords.length) * 50;
            }
            if (score > 0) {
                results.push({ 
                    student, 
                    className: cls.name, 
                    subjects: cls.subjects, 
                    maxScores: cls.maxScores,
                    score 
                });
            }
        });
    });

    return results.sort((a, b) => b.score - a.score).slice(0, 8);
}

// Display result card (Certificate Style)
function displayResult(result) {
    const { student, className, subjects, maxScores } = result;

    document.getElementById('notFoundSection').classList.add('hidden');
    document.getElementById('topStudentsSection').classList.add('hidden');
    document.getElementById('resultSection').classList.remove('hidden');

    document.getElementById('studentName').textContent = student.name;
    document.getElementById('studentClass').textContent = `فصل ${className}`;
    document.getElementById('totalScore').textContent = student.total;

    // Overall grade
    const overallEl = document.getElementById('overallGrade');
    overallEl.textContent = student.overallGrade;
    overallEl.className = `text-4xl font-black ${getGradeClass(student.overallGrade)}`;

    // Subject grid
    const grid = document.getElementById('subjectsGrid');
    const gradeKeys = Object.keys(student.grades);

    grid.innerHTML = subjects.map((subject, i) => {
        const score = student.scores[i] || 0;
        const max = (maxScores && maxScores[i]) ? maxScores[i] : 10;
        const matchingGradeKey = gradeKeys.find(k => normalizeArabic(k).includes(normalizeArabic(subject.slice(0, 3))));
        const grade = matchingGradeKey ? student.grades[matchingGradeKey] : '';
        const color = getGradeColor(grade);

        return `
            <div class="p-6 rounded-3xl bg-white/50 border border-gold-100/50 text-center hover:bg-white transition-all duration-300">
                <p class="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">${subject}</p>
                <p class="text-2xl font-black text-slate-900 mb-1">${score}</p>
                <div class="text-[10px] font-bold" style="color: ${color}">${grade || '-'}</div>
            </div>
        `;
    }).join('');

    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Show not found
function showNotFound() {
    document.getElementById('resultSection').classList.add('hidden');
    document.getElementById('topStudentsSection').classList.add('hidden');
    document.getElementById('notFoundSection').classList.remove('hidden');
}

// Search again
function searchAgain() {
    document.getElementById('resultSection').classList.add('hidden');
    document.getElementById('notFoundSection').classList.add('hidden');
    document.getElementById('topStudentsSection').classList.remove('hidden');
    document.getElementById('searchInput').value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Create background particles
function createParticles() {
    const container = document.getElementById('bg-particles');
    if (!container) return;
    const colors = ['rgba(212,146,42,', 'rgba(96,165,250,', 'rgba(52,211,153,'];

    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 4 + 2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.cssText = `
            position: absolute;
            border-radius: 50%;
            pointer-events: none;
            width: ${size}px; height: ${size}px;
            background: ${color}${Math.random() * 0.3 + 0.1});
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${Math.random() * 10 + 10}s linear infinite;
            animation-delay: ${Math.random() * 5}s;
        `;
        container.appendChild(particle);
    }
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', async () => {
    createParticles();
    await loadData();

    const input = document.getElementById('searchInput');
    const btn = document.getElementById('searchBtn');
    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Search button
    btn.addEventListener('click', () => {
        const query = input.value.trim();
        if (!query) return;
        const results = searchStudents(query);
        if (results.length > 0) {
            displayResult(results[0]);
        } else {
            showNotFound();
        }
    });

    // Enter key
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') btn.click();
    });

    // Enter key
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') btn.click();
    });
});
