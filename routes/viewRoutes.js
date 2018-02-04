module.exports = function(app) {
var appDir = path.dirname(require.main.filename);

    app.get('/', function(req, res) {
        let userSession = req.session;
        if (!userSession.user) {
            res.redirect('/login');
        }
        else {
            res.redirect('/home');
        }
    });


    app.get('/login', function(req, res) {
        res.sendFile(`${appDir}/client/login.html`);
    });

    app.get('/home2', function(req, res) {
        res.render("studentDash.handlebars");
    });
    
    app.get('/home', function(req, res) {
        let userSession = req.session;
        if (!userSession.user) {
            res.redirect('/')
        }
        else {
            const d = new Date();
            const hour = d.getHours()
            const min = d.getMinutes()
            const currentTime = hour * 60 + min;
            mongoClient.connect("mongodb://localhost", function(error, client) {
                if (!error) {
                    console.log("Connected successfully to MongoDB server");
                    let db = client.db('main');
                    var collection = db.collection('classes');
                    collection.findOne({
                        '$and': [{ 'teacher': userSession.user }, { 'endTime': { '$gt': currentTime } }, { 'startTime': { '$lt': currentTime } }]
                    }, function(error, classInfo) {
                        collection = db.collection('info');
                        collection.findOne({
                            "username": userSession.user
                        }, function(error, teacherInfo) {
                            res.render("dashboard", {
                                "course-title": classInfo.className,
                                "course-code": classInfo.courseCode,
                                "course-section": classInfo.sectionNumber,
                                "student-count": classInfo.studentsEnrolled,
                                "full-name": teacherInfo.firstName.charAt(0) + ". " + teacherInfo.lastName,
                                "todays-date": d.toLocaleDateString('en-us')
                            })
                        })
                    })
                }
            })
        }
    });

    app.get('/logout', function(req, res) {
        req.session.destroy();
        console.log("session destroyed")
        res.redirect('/')
    });


}