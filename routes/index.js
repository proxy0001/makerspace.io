var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var cors = require('cors');
var showdown = require('showdown');
var posts = {};
var postProto = {
  id: "",
  title: "",
  content: ""
};
var createId = function createId (str) {
  var data = (+new Date + Math.floor( Math.random()*999999 ) + str);
  var id = crypto.createHmac('md5', 'xyz').update(data).digest('hex');

    return id;
};


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.set('X-Auth-Required', 'true');
  req.session.returnUrl = req.originalUrl;
  res.redirect('/login/');
}

//need login
router.get('/1/post', ensureAuthenticated);
router.get('/1/post', cors());

router.get('/1/post', function(req, res, next) {
  req.app.db.models.Post.find({

  }, function(err, posts){
    if (err) return res.send(err)
      return res.send(posts);
  });
})


// 取得指定文章(ID)
router.get('/1/post/:id', function(req, res, next) {
  req.app.db.models.Post.find({
    _id: req.params.id
  }, function(err, posts){
    if (err) return res.send(err)
        return res.send(posts)
  });
});
// 建立新文章
router.post('/1/post', function(req, res, next) {
  var title = req.body.title;
  var content = req.body.content;
  var converter = new showdown.Converter();
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
    if (err) return res.send(err)
      return res.send(doc);
  });
  
});
// 修改文章
router.put('/1/post/:id', function(req, res, next) {
  var id = req.params.id;
  Object.keys(req.body).forEach(function (key) {
    if (key !== "id" && posts[id].hasOwnProperty(key)) {
      posts[id][key] = req.body[key];
    };
  });

  res.send(posts);
});
// 刪除指定文章(ID)
router.delete('/1/post/:id', function(req, res, next) {
  delete posts[req.params.id];
  res.send({
    status: 'OK'
  });
});



module.exports = router;
