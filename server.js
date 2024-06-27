// 라이브러리 사용법이므로 숙지하자 !
const express = require("express");
const app = express();

// css 파일 있는 폴더(public)를 등록해야한다. css,js,img 등 적용가능 (static 파일들)
app.use(express.static(__dirname + "/public"));

// ejs를 사용하기 위한 세팅
app.set("view engine", "ejs");

// 유저가 보낸 정보를 서버에서 출력하기 위한 세팅
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.listen(8081, () => {
  console.log("http://localhost:8081 에서 서버 실행 중");
});

// 웹 페이지 보내주기
app.get("/", (요청, 응답) => {
  응답.sendFile(__dirname + "/index.html");
});

// 새로운 페이지 만들기
app.get("/news", async (요청, 응답) => {
  await db.collection("post").insertOne({ title: "어쩌구" }); // post에 'title : 어쩌구' 추가
  // 응답.send("뉴스페이지");
});

// list에 들어가면 DB 데이터를 가져와 출력한다
app.get("/list", async (요청, 응답) => {
  let result = await db.collection("post").find().toArray();
  // console.log(result[0].title); // 0번째의 title 가져와 log에 출력
  // 응답.send(result[0].title); // title을 사이트에 보이도록 하기

  // ejs 파일을 보내주기 위해 sendFile(for html)이 아닌 render(for ejs)로 적어준다.
  // 서버 사이드 랜더링
  응답.render("list.ejs", { posts: result });
});

app.get("/time", (요청, 응답) => {
  응답.render("time.ejs", { date: new Date() });
});

app.get("/write", (요청, 응답) => {
  응답.render("write.ejs");
});

app.post("/add", async (요청, 응답) => {
  // 작성한 글을 DB로 보낸다.
  try {
    // 여기 코드 먼저 실행해보고

    // 제목이 비어있을 땐 저장하지 않도록 하기 (예외처리)
    if (요청.body.title == "") {
      응답.send("제목 입력 하지않았습니다.");
    } else if (요청.body.content == "") {
      응답.send("내용 입력 하지 않았습니다.");
    } else {
      await db.collection("post").insertOne({
        title: 요청.body.title,
        content: 요청.body.content,
      });
      console.log("DB로 게시되었습니다.");
      응답.redirect("/list"); // 특정 페이지로 이동시킨다
    }
  } catch (e) {
    // 에러나면 여기 실행
    console.log(e);
    응답.status(500).send("서버에러");
  }
});
