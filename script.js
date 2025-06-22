document.addEventListener('DOMContentLoaded', () => {
    const chatFileInput = document.getElementById('chatFile');
    const summarizeBtn = document.getElementById('summarizeBtn');
    const fileNameDisplay = document.getElementById('fileName');
    const resultsArea = document.getElementById('resultsArea');
    const summaryContent = document.getElementById('summaryContent');
    const loader = document.getElementById('loader');

    let selectedFile = null;

    summarizeBtn.disabled = true;

    chatFileInput.addEventListener('change', (event) => {
        selectedFile = event.target.files[0];
        if (selectedFile) {
            fileNameDisplay.textContent = `קובץ שנבחר: ${selectedFile.name}`;
            summarizeBtn.disabled = false;
        } else {
            fileNameDisplay.textContent = '';
            summarizeBtn.disabled = true;
        }
    });

    summarizeBtn.addEventListener('click', async () => {
        if (!selectedFile) {
            alert('אנא בחר קובץ תחילה.');
            return;
        }

        resultsArea.style.display = 'block';
        summaryContent.innerHTML = '';
        loader.style.display = 'block';
        summarizeBtn.disabled = true;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const fileContent = event.target.result;

            try {
                const response = await fetch('/api/summarize', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain; charset=utf-8',
                    },
                    body: fileContent,
                });

                loader.style.display = 'none';

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'אירעה שגיאה בשרת');
                }

                const summary = await response.json();
                displaySummary(summary);

            } catch (error) {
                loader.style.display = 'none';
                summaryContent.innerHTML = `<p style="color: red;">שגיאה: ${error.message}</p>`;
            } finally {
                summarizeBtn.disabled = false;
            }
        };
        reader.onerror = () => {
            loader.style.display = 'none';
            summaryContent.innerHTML = `<p style="color: red;">אירעה שגיאה בקריאת הקובץ.</p>`;
            summarizeBtn.disabled = false;
        };
        reader.readAsText(selectedFile, 'UTF-8');
    });

    function displaySummary(summary) {
        if (!summary || !summary.participants) {
            summaryContent.innerHTML = '<p>לא נמצאו נתונים לעיבוד.</p>';
            return;
        }
        
        let html = '<h3>סיכום לפי משתתפים:</h3><ul>';
        for (const [name, count] of Object.entries(summary.participants)) {
            html += `<li><span class="name">${escapeHtml(name)}</span> <span class="count">סה"כ ${count} הודעות</span></li>`;
        }
        html += '</ul>';
        
        summaryContent.innerHTML = html;
    }

    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}); 