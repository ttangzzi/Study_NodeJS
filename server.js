// 라이브러리 사용법이므로 숙지하자 !
const express = require("express");
const app = express();
// method-override를 사용하기 위한 세팅
const methodOverride = require("method-override");
// 해싱 함수 라이브러리
const bcrypt = require('bcrypt');
// DB에 세션 저장하기 위한 라이브러리
const MongoStore = require('connect-mongo');

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

// passport 라이브러리 코드
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')

app.use(passport.initialize())
app.use(session({
  secret: 'abc', // 암호화에 쓸 비번
  resave : false,
  saveUninitialized : false,
  cookie: { maxAge : 60 * 60 * 1000},
  store : MongoStore.create({
    mongoUrl : "mongodb+srv://cvbg0802:sook6055@cluster0.gi0zdlm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    dbName : 'forum'
  })
}))

app.use(passport.session())

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
  // 로그인한 유저만 글 작성할 수 있도록 한다.
  if(요청.user == null) {
    응답.send("로그인이 필요합니다.");
  }
  else {
    응답.render("write.ejs");
  }
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

app.get("/mypage", (요청, 응답)=> {
  try {
    if(요청.user != undefined) {
      응답.render("mypage.ejs", {username : 요청.user.username});
    }
    else {
      응답.send("로그인이 필요합니다.");
    }
    
  } catch(e) {
    console.log(e);
  }
})

app.get("/register", (요청, 응답)=> {
  응답.render('register.ejs');
})

app.post('/register', async(요청, 응답)=> {
  let search = await db.collection('user').findOne({username : 요청.body.username});
  let hash = await bcrypt.hash(요청.body.password, 10);

  if(search) { // 중복된 아이디 가입을 막기
    응답.send('중복된 아이디가 있습니다.');
  }
  // 비밀번호 확인란과 일치해야 가입 가능
  else if (요청.body.password != 요청.body.passwordCheck ) {
    응답.send('비밀번호 확인란을 확인하십시오.');
  }
  else {
    await db.collection('user')
  .insertOne({
    username : 요청.body.username, password : hash
  })
  응답.redirect('/');
  }
})

// ===== 회원기능 ======
app.get('/login', (요청, 응답)=> {
  응답.render('login.ejs');
});

app.post('/login', (요청, 응답, next)=>{
  passport.authenticate('local', (error, user, info)=> {
    if (error) return 응답.status(500).json(error);
    if (!user) return 응답.status(401).json(info.message);
    요청.logIn(user, (err)=> {
      if (err) return next(err);
      응답.redirect('/');
    })
  })(요청, 응답, next);
})

// passport 라이브러리를 사용하여 ID/PW 검증 로직 작성
passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb)=> {
  try {
    let result = await db.collection('user').findOne({ username : 입력한아이디})
    if (!result) {
      return cb(null, false, { message: '아이디 DB에 없음'});
    }
    // 해시된 비밀번호와 해시전 비밀번호를 비교한다.
    if (await(bcrypt.compare(입력한비번, result.password))) {
      return cb(null, result);
    } else {
      return cb(null, false, { message : '비번불일치'});
    }
  } catch(e) {
    console.log(e);
  }
}))

// 요청.login() 을 사용하면 해당 코드도 실행된다.
passport.serializeUser((user, done) => {
  process.nextTick(()=> {
    done(null, { _id : user._id, username : user.username});
  })
})

// 유저가 보낸 쿠키를 분석하는 역할을 하는 코드
passport.deserializeUser(async(user, done)=> {
  // 세션에 적힌 user 정보를 그대로 가져오는 문제 -> 최신으로 나오도록 db조회
  // 문제점 : 사이트에서 user.id 로 되어있는데 user._id 로 적어야함
  let result = await db.collection('user').findOne({ _id : new ObjectId(user._id) })
  // 비밀번호 항목은 삭제
  delete result.password;
  process.nextTick(()=> {
    done(null, result);
  })
})