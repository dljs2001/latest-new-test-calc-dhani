
async function test() {
    try {
        const response = await fetch('http://localhost:3000/api/log-download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test User', loanAmount: '1,23,456' })
        });
        const data = await response.json();
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}
test();
