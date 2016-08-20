var express = require('express');
var router = express.Router();
// var crypto = require('crypto');
var cors = require('cors');
var showdown = require('showdown');
// var posts = {};
// var postProto = {
//   id: "",
//   title: "",
//   content: ""
// };
// var createId = function createId (str) {
//   var data = (+new Date + Math.floor( Math.random()*999999 ) + str);
//   var id = crypto.createHmac('md5', 'xyz').update(data).digest('hex');

//     return id;
// };


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.set('X-Auth-Required', 'true');
  req.session.returnUrl = req.originalUrl;
  res.redirect('/login/');
}

/**
 * get posts
 * need login, cors
 */

router.get('/1/post', cors());
router.get('/1/post', function(req, res, next) {
  // req.app.db.models.Post.find({

  // }, function(err, posts){
  //   if (err) return res.send(err)
  //     return res.send(posts);
  // });
  var workflow = req.app.utility.workflow(req, res);
  var conditions;

  workflow.on('validate', function () {

    conditions = {};

    workflow.emit('getPosts');
  });  

  workflow.on('getPosts', function () {
    req.app.db.models.Post.find(conditions, function(err, posts){
      if (err) return res.send(err)
        return res.send(posts);
    });    
  });

  workflow.emit('validate');
})


/**
 * get post
 * need login, cors
 */

router.get('/1/post/:id', cors()); 
router.get('/1/post/:id', function(req, res, next) {
  // req.app.db.models.Post.find({
  //   _id: req.params.id
  // }, function(err, posts){
  //   if (err) return res.send(err)
  //       return res.send(posts)
  // });
  var workflow = req.app.utility.workflow(req, res);
  var id;

  workflow.on('validate', function () {

    conditions = {
      _id: req.params.id
    };

    workflow.emit('getPost');
  });  
  
  workflow.on('getPost', function () {
    req.app.db.models.Post.find(conditions, function(err, posts){
      if (err) return res.send(err)
          return res.send(posts)
    }); 
  });

  workflow.emit('validate');  
});


/**
 * create post
 * need login, cors
 */
router.post('/1/post', ensureAuthenticated);
router.post('/1/post', cors());
router.post('/1/post', function(req, res, next) {
  var workflow = req.app.utility.workflow(req, res);
  var converter = new showdown.Converter();
  var title = '';
  var content = '';

  workflow.on('validate', function () {
    if (!req.body.title)  return workflow.emit('exception', 'title is empty');
    if (!req.body.content)  return workflow.emit('exception', 'content is empty');
    if (!req.user)  return workflow.emit('exception', 'not login');
    if (!req.user.id) return workflow.emit('exception', 'missing user ID');
    if (!req.user.username) return workflow.emit('exception', 'missing username');

    title = req.body.title;
    content = req.body.content;

    workflow.emit('create');
  });

  workflow.on('create', function () {
    var doc = {
      subject: title,
      body: content,
      html: converter.makeHtml(content),
      userCreated: {
        id: req.user.id,
        user: req.user.username
      }
    };

    new req.app.db.models.Post(doc).save(function (err) {
      if (err) return res.send(err);
      return res.send(doc);
    });
    
  });
  
  return workflow.emit('validate');
});


/**
 * Update one post by id
 */
router.put('/1/post/:id', ensureAuthenticated);
router.put('/1/post/:id', cors()); 
router.put('/1/post/:id', function(req, res, next) {
  // var id = req.params.id;
  // Object.keys(req.body).forEach(function (key) {
  //   if (key !== "id" && posts[id].hasOwnProperty(key)) {
  //     posts[id][key] = req.body[key];
  //   };
  // });

  // res.send(posts);
  var workflow = req.app.utility.workflow(req, res);
  var conditions = {};
  var fieldsToSet = {};

  workflow.on('validate', function () {
    if (!req.body.title) {
      fieldsToSet['subject'] = req.body.title;
    };

    if (!req.body.content) {
      fieldsToSet['body'] = req.body.content;
      fieldsToSet['html'] = converter.makeHtml(req.bodycontent);
    };

    conditions = {
      _id: req.params.id
    };

    workflow.emit('update');
  });

  workflow.on('update', function () {
    req.app.db.models.Post.findOneAndUpdate(conditions, fieldsToSet, function (err, post) {
      res.send({
        status: 'OK'
      });
    });    
  });

  return workflow.emit('validate');
});


/**
 * Delete one post by id
 */
router.delete('/1/post/:id', ensureAuthenticated);
router.delete('/1/post/:id', cors());
router.delete('/1/post/:id', function (req, res, next) {

  var workflow = req.app.utility.workflow(req, res);
  var conditions;

  workflow.on('validate', function () {
    conditions = {
      _id: req.params.id
    };
    workflow.emit('delete');
  });

  workflow.on('delete', function () {
    req.app.db.models.Post.remove(conditions, function (err, nRemoved) {
      if (err) res.send(err);
      res.send({
        status: 'OK',
      });
    });
  })

  return workflow.emit('validate');
});




/**
 * like
 * one post by ID
 */
router.put('/1/post/:id/like', ensureAuthenticated);
router.put('/1/post/:id/like', cors());
router.put('/1/post/:id/like', function(req, res, next) {
  // var id = req.params.id;
  // var conditions = {
  //   _id: id
  // };
  // var fieldsToSet = {
  //   $push: { likes: req.params.id }
  // };
  // req.app.db.models.Post.findOneAndUpdate(conditions, fieldsToSet, function (err, post) {
  //   res.send(post);
  // });
  var workflow = req.app.utility.workflow(req, res);
  var conditions = {};
  var fieldsToSet = {};

  workflow.on('validate', function () {
    if (!req.params.id) return workflow.emit('exception', 'missing ID');

    conditions = {
      _id: req.params.id
    };

    if (!req.user)  return workflow.emit('exception', 'not login');
    if (!req.user.id) return workflow.emit('exception', 'missing user ID');
    
    fieldsToSet = {
      $push: {likes: req.user.id}
    };

    workflow.emit('update');
  });

  workflow.on('update', function () {
    req.app.db.models.Post.findOneAndUpdate(conditions, fieldsToSet, function (err, post) {
      if (err) res.send(err);
      res.send(post);
    });
  });

  return workflow.emit('validate');
});





module.exports = router;
