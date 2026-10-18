document.addEventListener('DOMContentLoaded', () => {
    const promptInput = document.getElementById('prompt');
    const passwordInput = document.getElementById('password');
    const sendButton = document.getElementById('sendButton');
    const responseDiv = document.getElementById('response');
    const errorDiv = document.getElementById('error');

    // Escucha el clic en el botón
    sendButton.addEventListener('click', enviarPrompt);

    // Escucha la tecla Enter en los campos
    promptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarPrompt();
    });
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarPrompt();
    });

    async function validarContraseña(password) {
        try {
            const response = await fetch('/scripts/chat/validate_password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: password })
            });
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error("Error al validar contraseña:", error);
            return false;
        }
    }

    async function enviarPrompt() {
        const prompt = promptInput.value.trim();
        const password = passwordInput.value;
        
        if (!password) {
            errorDiv.textContent = "Por favor, introduce la contraseña.";
            return;
        }
    
        if (!prompt) {
            responseDiv.textContent = "Por favor, escribe un prompt.";
            return;
        }
    
        // Validar contraseña con el backend
        const esValida = true; // await validarContraseña(password);
        if (!esValida) {
            errorDiv.textContent = "Contraseña incorrecta. Inténtalo de nuevo.";
            return;
        } else {
            errorDiv.textContent = "";
        }
    
        responseDiv.textContent = "Cargando respuesta...";
        responseDiv.classList.add('loading');
    
        try {
            const response = await fetch('/ollama-api/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'ministral-3:3b',
                    prompt: prompt,
                    stream: false
                })
            });
        
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
        
            const data = await response.json();
            responseDiv.textContent = data.response;
            responseDiv.classList.remove('loading');
        } catch (error) {
            responseDiv.textContent = `Error: ${error.message}`;
            responseDiv.classList.remove('loading');
            console.error(error);
        }
    }
});