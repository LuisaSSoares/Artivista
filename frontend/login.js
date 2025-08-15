document.addEventListener('DOMContentLoaded', function () {
    const formElement = document.querySelector('.form');
    const btnCadastrar = document.querySelector('.cadastrar'); 
    const btnEntrar = document.querySelector('.entrar');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const continueWithoutLoginLink = document.getElementById('continueWithoutLogin'); 
  
    // Redireciona para cadastro
    btnCadastrar.addEventListener('click', function () {
      window.location.href = 'cadastro.html';
    });
  
    // Limpa erro customizado ao digitar no email e senha
    emailInput.addEventListener('input', () => {
      emailInput.setCustomValidity('');
    });
  
    senhaInput.addEventListener('input', () => {
      senhaInput.setCustomValidity('');
    });
  
    // Evento de envio do formulário
    formElement.addEventListener('submit', function (event) {
      event.preventDefault();
      realizarLogin();
    });

    //Evento do link "continuarv sem login"
    continueWithoutLoginLink.addEventListener('click', function () {
      // Limpa todos os dados do usuário anterior
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('usuario');
      // Define o userType como 'guest'
      localStorage.setItem('userType', 'guest');
    });
  
    function realizarLogin() {
      const email = emailInput.value.trim();
      const senha = senhaInput.value;
  
      // Validação simples local do email
      if (!validarEmail(email)) {
        emailInput.setCustomValidity('Por favor, insira um email válido.');
        emailInput.reportValidity();
        return;
      } else {
        emailInput.setCustomValidity('');
      }
  
      if (!senha) {
        senhaInput.setCustomValidity('Por favor, insira a senha.');
        senhaInput.reportValidity();
        return;
      } else {
        senhaInput.setCustomValidity('');
      }
  
      const dadosLogin = {
        email: email,
        password: senha
      };
  
      fetch('http://localhost:3520/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosLogin)
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Salva token e dados do usuário
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('usuario', JSON.stringify(data.user))
            localStorage.setItem('userType', data.user.userType);
            // Redireciona para a página principal ou artista conforme fluxo
            window.location.href = 'index.html';
          } else {
            // Exibir mensagens de erro específicas nos inputs
            if (data.message.toLowerCase().includes('email')) {
              emailInput.setCustomValidity(data.message);
              emailInput.reportValidity();
            } else {
              emailInput.setCustomValidity('');
            }
  
            if (data.message.toLowerCase().includes('senha')) {
              senhaInput.setCustomValidity(data.message);
              senhaInput.reportValidity();
            } else {
              senhaInput.setCustomValidity('');
            }
  
            // Caso não seja erro específico de email ou senha, alerta
            if (!data.message.toLowerCase().includes('email') && !data.message.toLowerCase().includes('senha')) {
              alert(data.message || 'Erro ao realizar login.');
            }
          }
        })
        .catch(error => {
          console.error('Erro:', error);
          alert('Erro na conexão com o servidor.');
        });
    }
  
    function validarEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    }
  });
  