document.addEventListener('DOMContentLoaded', function () {
    const formElement = document.querySelector('.form');
    const btnContinuar = document.querySelector('.continuar');
    const checkboxArtista = document.getElementById('artista');
    const loginButton = document.querySelector('.login');
    const emailInput = document.getElementById('email');
    const userInput = document.getElementById('usuario');
    const confirmarSenhaInput = document.getElementById('confirmarSenha');

    // Redireciona para login
    loginButton.addEventListener('click', function () {
      window.location.href = 'login.html';
    });
  
    // Limpa erro customizado ao digitar no email, usuário e confirmar senha
    emailInput.addEventListener('input', () => {
      emailInput.setCustomValidity('');
    });
  
    userInput.addEventListener('input', () => {
      userInput.setCustomValidity('');
    });
  
    confirmarSenhaInput.addEventListener('input', () => {
      confirmarSenhaInput.setCustomValidity('');
    });
  
    // Altera o conteúdo do botão com base no checkbox
    checkboxArtista.addEventListener('change', function () {
      if (checkboxArtista.checked) {
        btnContinuar.innerHTML = 'Continuar <img src="./icons/arrow-right.svg" alt="seta">';
      } else {
        btnContinuar.textContent = 'Entrar';
      }
    });
  
    // Evento de envio do formulário
    formElement.addEventListener('submit', function (event) {
      event.preventDefault();
      cadastrarUsuario();
    });
  
    function cadastrarUsuario() {
      const nome = document.getElementById('nome').value.trim();
      const usuario = userInput.value.trim();
      const email = emailInput.value.trim();
      const senha = document.getElementById('senha').value;
      const confirmarSenha = confirmarSenhaInput.value;
      const isArtista = checkboxArtista.checked;
  
      // Validação de email local
      if (!validarEmail(email)) {
        emailInput.setCustomValidity('Por favor, insira um email válido.');
        emailInput.reportValidity();
        return;
      } else {
        emailInput.setCustomValidity('');
      }
  
      // Validação de confirmação de senha local
      if (senha !== confirmarSenha) {
        confirmarSenhaInput.setCustomValidity('As senhas não coincidem.');
        confirmarSenhaInput.reportValidity();
        return;
      } else {
        confirmarSenhaInput.setCustomValidity('');
      }
  
      const dadosCadastro = {
        name: nome,
        userName: usuario,
        email: email,
        password: senha,
        userType: isArtista ? 'artista' : 'padrão'  
      };
  
      fetch('http://localhost:3520/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosCadastro)
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            const user = data.user || { id: data.userId, ...dadosCadastro }
            delete user.password;
            localStorage.setItem('usuario', JSON.stringify(user));
            localStorage.setItem('userId', user.id);
            localStorage.setItem('userType', user.userType);
          
            if (data.token) {
              sessionStorage.setItem('authToken', data.token);
            }
            window.location.href = isArtista ? 'artista.html' : 'index.html';
          } else {
            // Exibir mensagens de erro específicas nos inputs
            if (data.message.includes('email')) {
              emailInput.setCustomValidity(data.message);
              emailInput.reportValidity();
            } else {
              emailInput.setCustomValidity('');
            }
  
            if (data.message.includes('usuário') || data.message.includes('nome de usuário')) {
              userInput.setCustomValidity(data.message);
              userInput.reportValidity();
            } else {
              userInput.setCustomValidity('');
            }
  
            if (!data.message.includes('email') && !data.message.includes('usuário') && !data.message.includes('nome de usuário')) {
              alert(data.message || 'Erro ao realizar cadastro.');
            }
          }
        })
        .catch(error => {
          console.error('Erro:', error);
        });
    }
  
    function validarEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    }
  });

  
  