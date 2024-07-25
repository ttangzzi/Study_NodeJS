const router = require('express').Router()

router.get('/shirts', (요청, 응답)=> {
  응답.send('셔츠 페이지');
});

router.get('/pants', (요청, 응답)=> {
  응답.send('바지 페이지');
})

module.exports = router;