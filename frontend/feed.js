document.addEventListener('DOMContentLoaded', () => {
    // Pega o parâmetro 'tab' da URL
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab');

    if (tabFromUrl) {
        // Seleciona todas as seções do feed
        const feedSections = document.querySelectorAll('.containerContent section');

        // Itera sobre cada seção e esconde todas, exceto a que corresponde ao parâmetro da URL
        feedSections.forEach(section => {
            if (section.dataset.tab === tabFromUrl) {
                section.removeAttribute('hidden');
            } else {
                section.setAttribute('hidden', '');
            }
        });
    }
});