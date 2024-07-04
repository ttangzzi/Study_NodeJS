// 라이브러리 사용법이므로 숙지하자 !
const express = require("express");
const app = express();
// method-override를 사용하기 위한 세팅
const methodOverride = require("method-override");
app.use(methodOverride("_method"));

// css 파일 있는 폴더(public)를 등록해야한다. css,js,img 등 적용가능 (static 파일들)
app.use(express.static(__dirname + "/public"));
// ejs를 사용하기 위한 세팅
app.set("view engine", "ejs");
// 유저가 보낸 정보를 서버에서 출력하기 위한 세팅
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// mongo DB 연결 세팅 코드 + Object ID 를 쓸 수 있도록 세팅
const { MongoClient, ObjectId } = require("mongodb");
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
  응답.render("list.ejs", { posts: result, pages: result });
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
      응답.redirect("/list/1"); // 특정 페이지로 이동시킨다
    }
  } catch (e) {
    // 에러나면 여기 실행
    console.log(e);
    응답.status(500).send("서버에러");
  }
});

// 상세페이지 기능
// 유저가 detail/어쩌고 접속하면
// {_id : 어쩌구} 글을 DB에서 찾아
// ejs 파일에 박아 보내준다
app.get("/detail/:postID", async (요청, 응답) => {
  try {
    let result = await db
      .collection("post")
      .findOne({ _id: new ObjectId(요청.params.postID) }); // id값을 찾기

    // 적절한 길이의 랜덤문자는 try catch로도 못잡으므로 if문을 한번 더 작성
    if (result == null) {
      응답.status(404).send("이상한 url 입력");
    }
    응답.render("detail.ejs", { posts: result });
  } catch (e) {
    // 예외 처리
    console.log(e);
    응답.status(404).send("이상한 url 입력");
  }
});

app.get("/edit/:postID", async (요청, 응답) => {
  let result = await db
    .collection("post")
    .findOne({ _id: new ObjectId(요청.params.postID) });
  응답.render("edit.ejs", { posts: result });
});

app.put("/update", async (요청, 응답) => {
  // // 여러가지 수정문법을 사용해본 흔적
  // await db.collection("post").updateMany({ _id: 1 }, { $inc: { like: 2 } });
  try {
    if (요청.body.title == "") {
      응답.send("제목 입력 하지않았습니다.");
    } else if (요청.body.content == "") {
      응답.send("내용 입력 하지않았습니다.");
    } else {
      let result = await db
        .collection("post")
        .updateOne(
          { _id: new ObjectId(요청.body.id) },
          { $set: { title: 요청.body.title, content: 요청.body.content } }
        );
      응답.redirect("/list");
    }
  } catch (e) {
    console.log(e);
    응답.status(500).send("서버 에러");
  }
});

app.delete("/delete", async (요청, 응답) => {
  // db에 있는 document 삭제하기
  await db
    .collection("post")
    .deleteOne({ _id: new ObjectId(요청.query.docid) });
  응답.send("삭제완료");
});

app.get("/list/:id", async (요청, 응답) => {
  // skip 5개 * (id-1)개 -> 0, 5, 10, 15, ...
  let page = await db.collection("post").find().toArray();
  let result = await db
    .collection("post")
    .find()
    .skip(5 * (요청.params.id - 1))
    .limit(5)
    .toArray();
  응답.render("list.ejs", { posts: result, pages: page });
});
