
## clone drywall into folder
  use [drywall][drywall]  
    git clone https://github.com/jedireza/drywall.git .

## install package
    npm install

## create db
  use [mongolab][mongolab]
  create db and add new database user

## setup config.js in drywall
    cp config.example.js config.js

## setting config
  change the db link
    exports.mongodb = {
      uri: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://proxy0001:123456@ds153735.mlab.com:53735/makespace'
    };

## use mongo to connect mlab db
    mongo ds153735.mlab.com:53735/makespace -u proxy0001 -p 123456

    use makespace

## insert data for admin

    db.admingroups.insert({ _id: 'root', name: 'Root' });
    db.admins.insert({ name: {first: 'Root', last: 'Admin', full: 'Root Admin'}, groups: ['root'] });
    var rootAdmin = db.admins.findOne();
    db.users.save({ username: 'root', isActive: 'yes', email: 'g.proxy0001@gmail.com', roles: {admin: rootAdmin._id} });
    var rootUser = db.users.findOne();
    rootAdmin.user = { id: rootUser._id, name: rootUser.username };
    db.admins.save(rootAdmin);


## setup smtp 

  use [sendgrid][sendgrid]  
  setting -> credentials -> add new credential  
  setting config.js  

    exports.smtp = {
      from: {
        name: process.env.SMTP_FROM_NAME || exports.projectName +' Website',
        address: process.env.SMTP_FROM_ADDRESS || 'your@email.addy'
      },
      credentials: {
        user: process.env.SMTP_USERNAME || 'proxy0003',
        password: process.env.SMTP_PASSWORD || '@Pass123',
        host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
        ssl: true
      }
    };


## start drywall
    npm start

## change admin password and login
change password: http://localhost:3000/login/forgot/   
login with admin


## add custom route api

  use [cors][cors] 
    npm i cors --save

  mount custom api before http404 on routes.js
    app.use('/',require('./routes/index'));

## add OAuth (facebook)
  create a facebook app 
  setting hosts to add alias for our domain to localhost
    127.0.0.1 makerspace.io

  set config.js
    facebook: {
      key: process.env.FACEBOOK_OAUTH_KEY || '1751113978477565',
      secret: process.env.FACEBOOK_OAUTH_SECRET || '743b7a7306b34b41ec59b9995bdc8bb4'
    },    

## sign up need email to confirm
  set config.js
    exports.requireAccountVerification = true;





## add check is login or not 
  need login
    //
    function ensureAuthenticated(req, res, next) {
      if (req.isAuthenticated()) {
        return next();
      }
      res.set('X-Auth-Required', 'true');
      req.session.returnUrl = req.originalUrl;
      res.redirect('/login/');
    }

    router.get('/1/post', ensureAuthenticated);

## stop the csrf for post
  [csrf][csrf]
    // app.js

    // app.use(csrf({ cookie: { signed: true } }));
    helmet(app);

    //response locals
    app.use(function(req, res, next) {
      // res.cookie('_csrfToken', req.csrfToken());
      res.locals.user = {};
      res.locals.user.defaultReturnUrl = req.user && req.user.defaultReturnUrl();
      res.locals.user.username = req.user && req.user.username;
      next();
    });

## add schema and require in models
  use [mongoose][mongoose] to handle mongodb

  create schema Post.js
  schema name "Post" and the db collection named "posts"
    // schema/Post.js

    'use strict';

    exports = module.exports = function(app, mongoose) {
      var postSchema = new mongoose.Schema({
        subject: { type: String, default: '' },
        body: { type: String, default: ''},
        tags: [String],
        userCreated: {
          id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          name: { type: String, default: '' },
          time: { type: Date, default: Date.now }
        }
      });
      app.db.model('Post', postSchema);
    };

  require Post.js
    // models.js 
    require('./schema/Post')(app, mongoose);





[drywall]: https://github.com/jedireza/drywall
[mongolab]: https://mlab.com/
[sendgrid]: https://app.sendgrid.com
[cors]: https://www.npmjs.com/package/cors
[mongoose]: http://mongoosejs.com/docs/
[csrf]: https://zh.wikipedia.org/wiki/跨站请求伪造

ref
- MongoDB Schema 設計指南, https://blog.toright.com/posts/4483/mongodb-schema-設計指南.html
- the-art-of-command-line, https://github.com/jlevy/the-art-of-command-line




## AWS
    chmod 400 /Volumes/Transcend/aws/pem/
    chmod 400 /Volumes/Transcend/aws/pem/lanyu_ubuntu.pem
  connect
    ssh -i "/Volumes/Transcend/aws/pem/lanyu_ubuntu.pem" ubuntu@ec2-52-74-222-144.ap-southeast-1.compute.amazonaws.com

