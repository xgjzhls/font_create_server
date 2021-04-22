const mysql = require("mysql");


//连接数据库
// var db = mysql.createConnection({
//     host: "localhost",
//     port: "3306",
//     user: "root",
//     password: "bzbsldeh",
//     database: "xdd"
// });
let option = {
        host: "123.56.84.161",
        port: "3306",
        user: "root",
        password: "1Bzbsldeh!",
        database: "xdd"
    }
    // var db = mysql.createConnection(option);
    // //2.发送请求(查询)
    // db.query("SELECT * FROM blog",function(err,data){
    // 	if(err){
    // 		console.log("数据库访问出错",err);
    // 	}else{
    // 		// console.log(data);
    // 	}
    // })

// app.get("/",function(req,res){
// 	res.send("express");
// });
// module.exports = db
// const mysql = require('mysql2');
// require('dotenv').config();
module.exports.stablishedConnection = () => {
    return new Promise((resolve, reject) => {
        const con = mysql.createConnection(option
            // {
            //     host: process.env.DB_HOST || localhost,
            //     user: process.env.DB_USER_NAME || myUserName,
            //     password: process.env.DB_PASSWORD || mypassword,
            //     database: process.env.DB_NAME || mydb
            // }
        );
        con.connect((err) => {
            if (err) {
                reject(err);
            }
            resolve(con);
        });

    })
}
module.exports.closeDbConnection = (con) => {
    con.destroy();
}