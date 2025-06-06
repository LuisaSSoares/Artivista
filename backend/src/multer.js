const multer =  require ('multer')
 
let storage = multer.diskStorage({
    destination: function(request, file, cb) {
        return cb (null, "./src/profile")
    },
    filename: function(request, file, cb) {
        let nome_sem_espacos = file.originalname.trim()
        let nome_array = nome_sem_espacos.split(' ')
        let nome_com_underline = nome_array.join('_')
        return cb(null, `${Date.now()}_${nome_com_underline}`)
    }
})

function fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.webp'];

    if (allowedTypes.includes(ext)) {
        cb(null, true); 
    } else {
        cb(new Error('Tipo de arquivo inválido. Somente JPG, JPEG, PNG e WEBP são permitidos.'));
    }
}

let upload = multer({
    storage,
    fileFilter
});
 
 
module.exports = upload