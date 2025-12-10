const fs = require('fs');
const path = require('path');

const deleteFile = (filePath) => {
    try {
        if (!filePath) return;

        // Construct absolute path if relative is provided
        const absolutePath = path.isAbsolute(filePath)
            ? filePath
            : path.join(__dirname, '..', filePath);

        if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
            console.log(`Deleted file: ${filePath}`);
        }
    } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
    }
};

module.exports = { deleteFile };
