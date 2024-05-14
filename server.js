// 라이브러리 사용법이므로 숙지하자 !
const express = require("express");
const app = express();

app.listen(8080, () => {
  console.log("http://localhost:8080 에서 서버 실행 중");
});

// 웹 페이지 보내주기
app.get("/", (요청, 응답) => {
  응답.sendfile(__dirname + "/index.html");
});

// 새로운 페이지 만들기
app.get("/news", (요청, 응답) => {
  응답.send("뉴스페이지");
});

app.get("/shop", (요청, 응답) => {
  응답.send("쇼핑페이지");
});
