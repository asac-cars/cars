'use strict';


///////////////////////
// Dependencies     //
/////////////////////

// DOTENV (Read the env variables)
require('dotenv').config();


// Express Framework
const express = require('express');

// CORS (Cross Origin Resource Sharing)
const cors = require('cors');

// Superagent
const superagent = require('superagent');

// PG
const pg = require('pg');

// Method Override
const methodOverride = require('method-override');

//Axios

const axios = require('axios');



/////////////////////////////
//// Application Setup    //
///////////////////////////

// Setting the PORT
const PORT = process.env.PORT || 3000 ;


// Running express on our app
const app = express();

// use CORS
app.use(cors());

// use middleware to have the data in the req body
app.use(express.urlencoded({ extended: true }));

// pg client
const client = new pg.Client(process.env.DATABASE_URL);
// const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// middle ware to use (put) and (delete) methods
app.use(methodOverride('_method'));


/////////////////////////////
//// Templating Engine /////
///////////////////////////

// Use the static dir
app.use(express.static('./public'));

// Set EJS view engine
app.set('view engine', 'ejs');




////////////////////
//// ROUTES  //////
//////////////////

app.get('/', homeHandler);

app.get('/specification', specHandler);

app.get('/specificationresult', specificationHandler); // Create Page for the user to search for a car // create a page to show results

app.get('/carfax', carfaxHandler); // Create Page for the user to search Carfax // create page to show result

app.get('/historyData', historyDataHandler);

app.get('/obd', obdHandler);

app.post('/obdResult', obdResultHandler);

app.get('/malfunctionList',malfunctionHandler);

app.post('/myMalfunctionList',myMalfunctionHandler);

app.get('/myMalfunctionList/:id', singleMalfunctionHandler);

app.get('/editMalfunctionList/:id', editMalfunctionHandler);

app.delete('/editMalfunctionList/:id', deleteObdHandler);

app.put('/editMalfunctionList/:id', updateObdHandler);


app.get('/charge', chargeHandler);

// Garage

app.get('/garage', garageHandler);

app.post('/myCars', myCarsHandler);

app.get('/myCars/:id', singleCarHandler);

app.put('/myCars/:id', updateHandler);

app.delete('/myCars/:id', deleteHandler);

app.get('/whatCar', whatCarIsThat);

// app.get('*', notFoundHandler);





function homeHandler (req,res){

  res.render('pages/index');

}

//localhost:7777/specification

function specHandler(req,res){
  res.render('pages/specification');
}

//localhost:7777/specificationresult?vin=xxx-xxx-xxx

function specificationHandler(req,res){


  console.log(req.query);

  let vin= req.query.vin;

  let key = process.env.API_KEY;

  let url = `https://api.carsxe.com/specs?key=${key}&vin=${vin}`;

  superagent.get(url).then(carData=>{
    let carDataBody= carData.body;


    let correctData = new Car(carDataBody);


    res.render('pages/specificationresult', {data:correctData});


  }).catch(error => {
    res.send(error);
  });



}

// Carfax
//localhost:7777/specification

function carfaxHandler (req,res){
  res.render('pages/carfax');
}


// Carfax Result
//localhost:7777/historyResult?vin=xxx-xxx-xxx

// function historyHandler(req,res){

//   let getReportData = require('./history/history.json');

//   // let historyData= new Report(getReportData);

//   res.send(getReportData);

// res.render('historyresult', {report:historyData});



// let vin = req.body.vin;

// let key= process.env.API_KEY;

// let url = `https://api.carsxe.com/history?key=${key}&vin=${vin}`;

// superagent.get(url).then(historyData=>{
//   let historyDataBody= historyData.body;

//   let correctData= new Report(historyDataBody);

//   res.render('historyresult', {report:correctData});

// });
// }

function historyDataHandler (req,res){

  let getHistoryData = require('./history/report.json');

  let correctData = new Report (getHistoryData);

  res.render('pages/historyresult', {report:correctData});

}



// OBD Handler
// http://localhost:7777/obd

function obdHandler(req,res){
  res.render('pages/obd');
}

// OBD Result Handler
function obdResultHandler(req,res){

  let obd = req.body.obd;

  let key= process.env.API_KEY;

  let url= `https://api.carsxe.com/obdcodesdecoder?key=${key}&code=${obd}`;


  superagent.get(url).then(data=>{

    let dataBody=data.body;

    let correctData= new OBD(dataBody);

    res.render('pages/obdResult',{data:correctData});
  });

  // superagent.get(url).then(obdData=>{
  //   let obdDataBody= obd
  // });


}

function malfunctionHandler (req,res){


  let SQL= `SELECT * FROM obd;`;

  client.query(SQL).then(data=>{

    // res.send(data.rows);
    res.render('pages/malfunctionList', {data:data.rows, count:data.rows.length});
  });

  console.log(req.query);


}

function myMalfunctionHandler(req,res){
  let id;

  let SQL = 'INSERT INTO obd (code,diagnosis,date) VALUES ($1,$2,$3) RETURNING id;';

  const {code,diagnosis,date}= req.body;

  let safeValues = [code,diagnosis,date];

  let sqlSearch= `SELECT * FROM obd WHERE code = '${code}';`;

  client.query(sqlSearch).then(searchedResult=>{
    if(searchedResult.rowCount>0){

      res.redirect(`/myMalfunctionList/${searchedResult.rows[0].id}`);
    } else{

      client.query(SQL,safeValues).then(result=>{
        id =result.rows[0].id;
        res.redirect(`/myMalfunctionList/${id}`);
      });

    }
  });
}


function singleMalfunctionHandler (req,res){
  const SQL= `SELECT * from obd WHERE id=${req.params.id};`;

  client.query(SQL).then(result=>{
    // res.send(result.rows[0]);
    res.render('pages/singleMalfunction', {data:result.rows[0]});
  });
}

function editMalfunctionHandler (req,res){
  const SQL= `SELECT * from obd WHERE id=${req.params.id};`;

  client.query(SQL).then(result=>{
    res.render('pages/editObd', {data:result.rows[0]});
  });
}


function deleteObdHandler (req,res){

  let SQL = `DELETE FROM obd WHERE id=$1;`;
  let value = [req.params.id];
  client.query(SQL,value).then(res.redirect('/malfunctionList'));

}

function updateObdHandler (req,res){

  let id= req.params.id;

  let SQL = `UPDATE obd SET code=$1, diagnosis=$2, date=$3 WHERE id=$4;`;

  const {code,diagnosis,date}=req.body;

  const safeValues= [code,diagnosis,date,id];

  client.query(SQL,safeValues).then(()=>{
    // res.redirect(`/editMalfunctionList/${id}`);
    res.redirect(`/malfunctionList`);
  });

}


function chargeHandler(req,res){
  res.render('pages/charge');
}

// function chargeResultHandler(req, res){
//   let location= req.query.city;

//   let key= process.env.CHARGE_API;

//   // let url =`https://api.openchargemap.io/v3/poi/?output=json&latitude=31.9539&longitude=35.9106&maxresults=10&key=a8498b9c-341a-41b3-9e23-d55e7e4fff5c`;

//   let url =`https://api.openchargemap.io/v3/poi/?output=json&countrycode=${location}&maxresults=10&key=${key}`;

//   superagent.get(url).then(mapData=>{
//     let mapDataBody= mapData.body;

//   })
// }

// http://localhost:7777/garage

function garageHandler (req,res){

  const SQL = `SELECT * FROM cars;`;

  client.query(SQL).then(data=>{

    // res.send(data.rows);
    res.render('pages/garage', {cars:data.rows, count:data.rows.length});
  });

}


function myCarsHandler(req,res){
  let id;

  let SQL= 'INSERT INTO cars (vin, year, make, model ,engine, style, madeIn, fuelCapacity, fuelInternal,fuelExternal,transmission,seats, price,alloy_wheels, automatic_headlights, cd_player, child_safety_door_locks,fogLights,cruise_control,driverAirbag,passenger_airbag,cooled_seat,heated_seat,parkingAid,genuine_wood_trim,heated_exterior_mirror,heated_steering_wheel,keyless_entry,leather_seat,navigation_aid,power_windows) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31) RETURNING id;';

  const {vin, year, make, model ,engine, style, madeIn, fuelCapacity, fuelInternal,fuelExternal,transmission,seats, price,alloy_wheels, automatic_headlights, cd_player, child_safety_door_locks,fogLights,cruise_control,driverAirbag,passenger_airbag,cooled_seat,heated_seat,parkingAid,genuine_wood_trim,heated_exterior_mirror,heated_steering_wheel,keyless_entry,leather_seat,navigation_aid,power_windows}=req.body;

  const safeValues= [vin, year, make, model ,engine, style, madeIn, fuelCapacity, fuelInternal,fuelExternal,transmission,seats, price,alloy_wheels, automatic_headlights, cd_player, child_safety_door_locks,fogLights,cruise_control,driverAirbag,passenger_airbag,cooled_seat,heated_seat,parkingAid,genuine_wood_trim,heated_exterior_mirror,heated_steering_wheel,keyless_entry,leather_seat,navigation_aid,power_windows];

  const sqlSearch = `SELECT * FROM cars WHERE vin = '${vin}' ;`;

  client.query(sqlSearch).then(searchedResult=>{

    if(searchedResult.rowCount>0){
      res.redirect(`/myCars/${searchedResult.rows[0].id}`);

    } else{
      client.query(SQL,safeValues).then(result=>{
        id =result.rows[0].id;
        res.redirect(`/myCars/${id}`);
      });
    }

  });

}

function singleCarHandler (req,res){
  const SQL= `SELECT * from cars WHERE id=${req.params.id};`;

  client.query(SQL).then(result=>{
    // res.send(result.rows[0]);
    res.render('pages/singleCar', {data:result.rows[0]});
  });
}

function updateHandler (req,res){
  let id= req.params.id;

  let SQL = `UPDATE cars SET vin=$1, year=$2, make=$3, model=$4 ,engine=$5, style=$6, madeIn=$7, fuelCapacity=$8, fuelInternal=$9,fuelExternal=$10,transmission=$11,seats=$12, price=$13 ,alloy_wheels=$14 , automatic_headlights=$15, cd_player=$16, child_safety_door_locks=$17,fogLights=$18,cruise_control=$19,driverAirbag=$20,passenger_airbag=$21,cooled_seat=$22,heated_seat=$23,parkingAid=$24,genuine_wood_trim=$25,heated_exterior_mirror=$26,heated_steering_wheel=$27,keyless_entry=$28,leather_seat=$29,navigation_aid=$30,power_windows=$31 WHERE id=$32;`;

  const {vin, year, make, model ,engine, style, madeIn, fuelCapacity, fuelInternal,fuelExternal,transmission,seats, price,alloy_wheels, automatic_headlights, cd_player, child_safety_door_locks,fogLights,cruise_control,driverAirbag,passenger_airbag,cooled_seat,heated_seat,parkingAid,genuine_wood_trim,heated_exterior_mirror,heated_steering_wheel,keyless_entry,leather_seat,navigation_aid,power_windows}=req.body;

  const safeValues= [vin, year, make, model ,engine, style, madeIn, fuelCapacity, fuelInternal,fuelExternal,transmission,seats, price,alloy_wheels, automatic_headlights, cd_player, child_safety_door_locks,fogLights,cruise_control,driverAirbag,passenger_airbag,cooled_seat,heated_seat,parkingAid,genuine_wood_trim,heated_exterior_mirror,heated_steering_wheel,keyless_entry,leather_seat,navigation_aid,power_windows,id];

  client.query(SQL,safeValues).then(()=>{
    res.redirect(`/myCars/${id}`);
  });

}


function deleteHandler(req,res) {
  let SQL = `DELETE FROM cars WHERE id=$1;`;
  let value = [req.params.id];
  client.query(SQL,value).then(res.redirect('/garage'));
}

// http://api.carsxe.com/whatcaristhat?key=<CarsXE_API_Key>&body=

function whatCarIsThat (req,res){


  res.render('pages/whatCar');
  // let key= process.env.API_KEY;
  // let body=`https://upload.wikimedia.org/wikipedia/commons/4/44/2019_Acura_RDX_A-Spec_front_red_4.2.18.jpg`;
  // let url= `http://api.carsxe.com/whatcaristhat?key=${key}&body=${body}`;



  // superagent.get(url).then(data=>{
  //   console.log(data.body);
  //   res.send(data.body);
  // }).catch(err=>{
  //   console.log(err);
  //   res.send(err);
  // });
  // superagent.post(url).send({body:'https://upload.wikimedia.org/wikipedia/commons/4/44/2019_Acura_RDX_A-Spec_front_red_4.2.18.jpg'}).end((err,data)=>{
  //   console.log(data);
  //   res.send(data);
  // });
}


app.get('/whatCarResult', (req,res)=>{

  let link= req.query;

  let key= process.env.API_KEY;

  axios.post(`http://api.carsxe.com/whatcaristhat?key=${key}`, {
    body: link.link
  })
    .then(function (response) {
      console.log(response);
    })
    .catch(function (error) {
      console.log(error);
    });

});


///////////////////////
//// Constructor  ////
/////////////////////

function Car (data){

  this.vin=data.input.vin;

  // Attributes
  this.year= data.attributes.year;

  this.make= data.attributes.make;

  this.model= data.attributes.model;

  this.engine= data.attributes.engine;

  this.style= data.attributes.style;

  this.madeIn= data.attributes.made_in;

  this.fuelCapacity= data.attributes.fuel_capacity;

  this.fuelInternal= data.attributes.city_mileage;

  this.fuelExternal= data.attributes.highway_mileage;

  this.transmission=data.attributes.transmission_short;

  this.seats= data.attributes.standard_seating;

  this.price=data.attributes.manufacturer_suggested_retail_price;


  // Equipments

  this.alloy_wheels= data.equipment.alloy_wheels;

  this.automatic_headlights= data.equipment.automatic_headlights;

  this.cd_player=data.equipment.cd_player;

  this.child_safety_door_locks=data.equipment.child_safety_door_locks;

  this.fogLights=data.equipment.fog_lights;

  this.cruise_control=data.equipment.cruise_control;

  this.driverAirbag= data.equipment.driver_airbag;

  this.passenger_airbag= data.equipment.passenger_airbag;

  this.cooled_seat= data.equipment.front_cooled_seat;

  this.heated_seat= data.equipment.front_heated_seat;

  this.parkingAid= data.equipment.electronic_parking_aid;

  this.genuine_wood_trim= data.equipment.genuine_wood_trim;

  this.heated_exterior_mirror=data.equipment.heated_exterior_mirror;

  this.heated_steering_wheel= data.equipment.heated_steering_wheel;

  this.keyless_entry= data.equipment.keyless_entry;

  this.leather_seat= data.equipment.leather_seat;

  this.navigation_aid= data.equipment.navigation_aid;

  this.power_windows= data.equipment.power_windows;

  this.warranties=data.warranties;

}


function Report (data){
  this.odometer=data.historyInformation[0].VehicleOdometerReadingMeasure;

  this.odometerUnit = data.historyInformation[0].VehicleOdometerReadingUnitCode;

  this.status=data.junkAndSalvageInformation[0].ReportingEntityAbstract.ReportingEntityCategoryText;

  this.reportingCompany=data.junkAndSalvageInformation[0].ReportingEntityAbstract.EntityName;

  this.insurance= data.insuranceInformation[0].ReportingEntityAbstract.EntityName;

  this.insuranceEmail=data.insuranceInformation[0].ReportingEntityAbstract.ContactEmailID;

  this.insurancePhone=data.insuranceInformation[0].ReportingEntityAbstract.TelephoneNumberFullID;

}


function OBD (data){

  this.code=data.code;
  this.diagnosis=data.diagnosis;
  this.date=new Date(data.date).toString().slice(0,15);
}

// this.time = new Date(data.valid_date).toString().slice(0, 15);


/////////////////////////////
//// Server Listening   ////
///////////////////////////

// app.listen(PORT, ()=>{
//   console.log('Listing on PORT:', PORT);
// });

client.connect()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`listening on ${PORT}`)
    );
  });
