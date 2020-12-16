const cloudinary = require('cloudinary');


cloudinary.config({
    cloud_name: 'diuhcqjcw',
    api_key: '637717991655429',
    api_secret: '6PwTMXLijKWvm2fA0d9Ki0PvPkU'
});

exports.uploads = (file, folder) => {
    return new Promise(resolve => {
        cloudinary.uploader.upload(file, (result) => {
            resolve({
                url: result.url,
                id: result.public_id
            })
        }, {
            resource_type: "auto",
            folder: folder
        })
    })
}