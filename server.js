// 라이브러리 사용법이므로 숙지하자 !
const express = require("express");
const app = express();

// css 파일 있는 폴더(public)를 등록해야한다. css,js,img 등 적용가능 (static 파일들)
app.use(express.static(__dirname + "/public"));

// mongo DB 연결 세팅 코드
const { MongoClient } = require("mongodb");

let db;
const url =
  "mongodb+srv://cvbg0802:sook6055@cluster0.gi0zdlm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
new MongoClient(url)
  .connect()
  .then((client) => {
    console.log("DB연결성공");
    db = client.db("forum"); // forum에 연결
  })
  .catch((err) => {
    console.log(err);
  });

// ==================================== //
app.listen(8080, () => {
  console.log("http://localhost:8080 에서 서버 실행 중");
});

// 웹 페이지 보내주기
app.get("/", (요청, 응답) => {
  응답.sendFile(__dirname + "/index.html");
});

// 새로운 페이지 만들기
app.get("/news", (요청, 응답) => {
  db.collection("post").insertOne({ title: "어쩌구" }); // post에 'title : 어쩌구' 추가
  // 응답.send("뉴스페이지");
});

// list에 들어가면 DB 데이터를 가져와 출력한다
app.get("/list", async (요청, 응답) => {
  let result = await db.collection("post").find().toArray();
  console.log(result[0].title); // 0번째의 title 가져오기
  응답.send(result[0].title);
});
