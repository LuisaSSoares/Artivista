const multer = require('multer');
const path = require('path');

// Storage para foto de perfil
const storageProfile = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './src/profile'),
    filename: (req, file, cb) => {
        const nome = file.originalname.trim().split(' ').join('_');
        cb(null, `${Date.now()}_${nome}`);
    }
});

// Storage para fotos do feed
const storageFeed = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './src/feed'),
    filename: (req, file, cb) => {
        const nome = file.originalname.trim().split(' ').join('_');
        cb(null, `${Date.now()}_${nome}`);
    }
});

// Filtro de tipos de arquivo
function imageOnlyFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedImages = ['.jpg', '.jpeg', '.png', '.webp'];

    if (allowedImages.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo inválido. Somente imagens (JPG, JPEG, PNG, WEBP) são permitidas.'));
    }
}

function imageAndVideoFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov', '.webm', '.avi'];

    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo inválido. Somente imagens e vídeos (JPG, PNG, MP4, etc.) são permitidos.'));
    }
}

// Upload para foto de perfil
const uploadProfile = multer({ storage: storageProfile, fileFilter:imageOnlyFilter });

// Upload para fotos do feed (permite múltiplas imagens, por exemplo)
const uploadFeed = multer({ storage: storageFeed, fileFilter:imageAndVideoFilter });

module.exports = {
    uploadProfile,
    uploadFeed
};
