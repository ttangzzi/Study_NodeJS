const router = require('express').Router()

let connectDB = require('./../database.js');

let db;
connectDB.then((client) => {
    db = client.db("forum"); // forum에 연결
  })
  .catch((err) => {
    console.log(err);
  });

router.get('/shirts', async(요청, 응답)=> {
  let result = await db.collection('post').find().toArray();
  응답.send('셔츠 페이지');
});

router.get('/pants', (요청, 응답)=> {
  응답.send('바지 페이지');
})

module.exports = router;