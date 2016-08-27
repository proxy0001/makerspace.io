'use strict';

/*
 * Read single post.
 *
 * /post/:id
 */
exports.readOneById = function (req, res) {
  console.log(req.params.id);
  req.app.db.models.Post.findOne({
    _id: req.params.id
  }, function (err, post) {
    console.log(post);
    res.render('post/single', {
      subject: post.subject,
      html: post.html
    });
  });
  // req.app.db.models.Post.findOne({
  //   _id: req.params.id
  // }, function (err, post) {
  //   console.log(post.html);
  //   res.render('post/single', {
  //     subject: post.subject,
  //     html: post.html
  //   });
  // });
};