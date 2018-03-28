let app = {
    // Global reviews array for staging changes to localstorage and on first load,
    // is updated to match localstorage data
    reviews: [],
    // Global review object for staging additions and changes to localstorage
    review: {},
    // Global flag for indicating whether a photo has been taken with the camera
    picTaken: false,
    // Global variable for holding the directory entry object for use by cordova's file plugin
    imageDirectory: {},
    // Global array containing the star spans for rating used by several functions
    stars: document.querySelectorAll('.star'),
    
    init: function () {
        document.getElementById('add-button').addEventListener('click', app.nav);
        document.getElementById('cancel-button').addEventListener('click', app.nav);
        document.getElementById('save-button').addEventListener('click', app.nav);
        document.getElementById('back-button').addEventListener('click', app.nav);
        document.getElementById('delete-button').addEventListener('click', app.nav);
        document.getElementById('camera-button').addEventListener('click', app.openCamera);
        app.stars.forEach(function (star) {
            star.addEventListener('click', app.setRating);
        });
        app.listCheck();
    },

    listCheck: function () {
        let list = document.getElementById('list-section');
        if (localStorage.length == 0) {
            list.innerHTML = "";
            let mesg = document.createElement('h2');
            mesg.classList.add('t3');
            mesg.classList.add('no-reviews');
            mesg.textContent = "Please add a review!";
            list.appendChild(mesg);
        } else {
            list.innerHTML = "";
            app.reviews = [];
            for (let i = 0, key, len = localStorage.length; i < len; i++) {
                key = localStorage.key(i);
                app.reviews.push(JSON.parse(localStorage[key]));
            }
            list.appendChild(app.buildRevList(app.reviews));
        }
    },

    buildRevList: function (arr) {
        let revList = document.createElement('ul');
        revList.classList.add('list-view');
        revList.setAttribute('id', 'review-list');
        arr.forEach(review => {
            // Create list items
            let listItem = document.createElement('li');
            listItem.classList.add('list-item');
            listItem.classList.add('review-card');
            listItem.setAttribute('id', review.id);
            // Creating the User Mini avatar
            let img = document.createElement('img');
            img.src = review.img;
            img.alt = `A review picture`;
            img.classList.add('avatar');
            listItem.appendChild(img);
            // Create the paragraph and action button
            let p = document.createElement('p');
            let length = review.title.length;
            if (review.title.length > 10) {
                p.textContent = review.title.substring(0, 12) + '...';
            } else {
                p.textContent = review.title;
            }
            listItem.appendChild(p);
            let rating = review.rating;
            let ratingdiv = document.createElement('div');
            ratingdiv.classList.add('ratingdiv');
            while (rating > 0) {
                let starspan = document.createElement('span');
                starspan.classList.add('star');
                starspan.classList.add('rated');
                ratingdiv.appendChild(starspan);
                rating--;
            }
            listItem.appendChild(ratingdiv);
            let span = document.createElement('span');
            span.classList.add('action-right');
            span.classList.add('icon');
            span.classList.add('arrow_right');
            span.id = 'details';
            span.addEventListener('click', app.nav);
            listItem.appendChild(span);
            revList.appendChild(listItem);
        });
        return revList;
    },

    buildDetail: function (id) {
        let detailSection = document.getElementById('detail-section');
        detailSection.innerHTML = "";
        let revItem = JSON.parse(localStorage.getItem(id));
        console.log(revItem);
        let card = document.createElement('div');
        card.classList.add('card');
        card.setAttribute('id', 'detail-card');
        card.setAttribute('data-id', revItem.id);
        let img = document.createElement('img');
        img.classList.add('detail-img');
        img.src = revItem.img;
        card.appendChild(img);
        while (revItem.rating > 0) {
            let starspan = document.createElement('span');
            starspan.classList.add('star');
            starspan.classList.add('rated');
            card.appendChild(starspan);
            revItem.rating--;
        }
        let title = document.createElement('p');
        title.textContent = revItem.title;
        title.classList.add('rev-title');
        card.appendChild(title);
        detailSection.appendChild(card);
    },

    clearFields: function () {
        let title = document.getElementById('nm');
        let starRating = document.querySelector('.stars');
        let prevImage = document.getElementById('img-thumb');
        title.value = '';
        starRating.setAttribute('data-rating', 1);
        prevImage.src = '';
    },

    setOptions: function (srcType) {
        let options = {
            // Some common settings are 20, 50, and 100
            quality: 45,
            destinationType: Camera.DestinationType.FILE_URI,
            // In this app, dynamically set the picture source, Camera or photo gallery
            sourceType: srcType,
            encodingType: Camera.EncodingType.JPEG,
            mediaType: Camera.MediaType.PICTURE,
            allowEdit: true
        };
        return options;
    },

    openCamera: function () {

        let srcType = Camera.PictureSourceType.CAMERA;
        let options = app.setOptions(srcType);
        options.targetHeight = 300;
        options.targetWidth = 300;

        navigator.camera.getPicture(function cameraSuccess(imageUri) {
            let image = document.getElementById('img-thumb');
            image.src = imageUri;
            app.picTaken = true;

        }, function cameraError(error) {
            console.debug("Unable to obtain picture: " + error, "app");
            app.picTaken = false;
        }, options);
    },

    saveReview: function () {
        app.review.id = Date.now();
        app.review.title = document.getElementById('nm').value;
        app.review.rating = document.querySelector('.stars').getAttribute('data-rating');
        app.review.img = document.getElementById('img-thumb').getAttribute('src');
        localStorage.setItem(app.review.id, JSON.stringify(app.review));
        app.moveFile(app.review.img);
    },

    moveFile: function (fileUri) {
        window.resolveLocalFileSystemURL(
            fileUri,
            function (fileEntry) {
                let fileDir = cordova.file.dataDirectory;
                window.resolveLocalFileSystemURL(fileDir, function (dirEntry) {
                    console.log(dirEntry);
                    let fileName = app.review.id + ".jpg";
                    console.log(fileName);
                    dirEntry.getDirectory('images', {
                            create: true,
                            exclusive: false
                        },
                        function (newDirEntry) {
                            console.log(newDirEntry);
                            app.imageDirectory = newDirEntry;
                            console.log(app.imageDirectory);
                            fileEntry.copyTo(newDirEntry, fileName, (resolve) => {
                                app.review.img = resolve.nativeURL;
                                app.review.fileObject = resolve;
                                console.log(app.review.fileObject);
                                localStorage.setItem(app.review.id, JSON.stringify(app.review));
                            }, app.failure);
                        }, app.failure);
                }, app.failure);
            }, app.failure);
    },

    deleteFile: function(id){
        let deleteTarget = JSON.parse(localStorage.getItem(id));
        window.resolveLocalFileSystemURL(app.imageDirectory.nativeURL,
            function(dir){
                console.log(dir);
                dir.getFile(deleteTarget.fileObject.name, {create: false}, function(fileEntry){
                    console.log(fileEntry);
                    fileEntry.remove(function(){
                        console.log("File deleted succesfully.");
                    }, app.failure)
                }, app.failure)
        }, app.failure)
    },

    failure: function (err) {
        console.log(err);
    },

    deleteReview: function (id) {
        app.deleteFile(id);
        localStorage.removeItem(id);
        app.listCheck();
    },

    setRating: function (ev) {
        let span = ev.currentTarget;
        let match = false;
        let num = 0;
        app.stars.forEach(function (star, index) {
            if (match) {
                star.classList.remove('rated');
            } else {
                star.classList.add('rated');
            }
            if (star === span) {
                match = true;
                num = index + 1;
            }
        });
        document.querySelector('.stars').setAttribute('data-rating', num);
    },

    nav: function (ev) {
        switch (ev.target.id) {
            // If user selects home/main page on the bar
            case 'add-button':
                app.clearFields();
                app.stars[0].dispatchEvent(new MouseEvent('click'));
                document.getElementById('add-page').classList.add('active');
                document.getElementById('list-page').classList.remove('active');
                break;
                // If user selects favourites page on the bar
            case 'cancel-button':
                document.getElementById('list-page').classList.add('active');
                document.getElementById('add-page').classList.remove('active');
                break;
            case 'save-button':
                if (app.picTaken && document.getElementById('nm').value.length > 0) {
                    app.prompt('save');
                    app.saveReview();
                    app.listCheck();
                    document.getElementById('list-page').classList.add('active');
                    document.getElementById('add-page').classList.remove('active');
                } else {
                    app.prompt('missinginfo');
                }
                break;
            case 'back-button':
                document.getElementById('list-page').classList.add('active');
                document.getElementById('detail-page').classList.remove('active');
                break;
            case 'delete-button':
                app.prompt('delete');
                app.deleteReview(document.getElementById('detail-card').getAttribute('data-id'));
                document.getElementById('list-page').classList.add('active');
                document.getElementById('detail-page').classList.remove('active');
                break;
            case 'details':
                document.getElementById('detail-page').classList.add('active');
                document.getElementById('list-page').classList.remove('active');
                app.buildDetail(ev.target.parentElement.getAttribute('id'));
                console.log(ev.target.parentElement.getAttribute('id'));
                break;

        }
    },

    prompt: function (choice) {
        let overlay = document.querySelector('.overlay-bars');
        // Switch message displayed based on how the prompt function was called
        switch (choice) {
            // Review is saved
            case 'save':
                var message = document.querySelector('#msg');
                message.classList.remove('error');
                message.classList.add('success');
                message.innerHTML = "Saving Review";
                break;
                // Review is deleted from the review list page
            case 'delete':
                message = document.querySelector('#msg');
                message.classList.remove('success');
                message.classList.add('error');
                message.innerHTML = "Review Deleted";
                break;
            case 'missinginfo':
                message = document.querySelector('#msg');
                message.classList.remove('success');
                message.classList.add('error');
                message.innerHTML = "Missing photo or title!";
                break;
        }
        overlay.classList.add('active');
        // Timeout for removing the overlay after message is displayed
        setTimeout(() => {
            overlay.classList.remove('active');
        }, 700);
    },
};
document.addEventListener('deviceready', app.init);