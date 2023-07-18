const service = require("./tables.service");
const resService = require("../reservations/reservations.services")
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");
const checkCapacity = require("./tablesUtils/checkCapacity");
const checkTableName = require("./tablesUtils/checkTableName");
const hasProperties = require("../utils/hasProperties");
const mergeSort = require("../utils/mergeSort");
const compare = require("./tablesUtils/compare");
const checkOccupiedStatus = require("./tablesUtils/checkOccupiedStatus");
const reservationExists = require("./tablesUtils/reservationExists");
const checkTableCapacity = require("./tablesUtils/checkTableCapacity")
const tableExists = require("./tablesUtils/tableExists");
const checkSeatedStatus = require("./tablesUtils/checkSeatedStatus")
const checkIfReservationIsBooked = require("./tablesUtils/checkIfReservationIsBooked")


async function list(req,res,next){
    const dat = await service.list();
    let data = mergeSort(compare,dat);
    res.json({data:data})
}

async function create(req,res,next){
    const table = {...req.body.data,occupied:false};
    let created =  await service.create(table);
    res.status(201).json({data:created})
}

async function seat(req,res,next){
    const {data={}} = req.body;
    const {table_id} = req.params;
    const table = await service.read(table_id);
    const updatedTable = {...table,reservation_id:data.reservation_id,occupied:true};
    const seated = await service.seat(updatedTable)
    res.json({data: seated});
}

async function seatReservation(req,res,next){
    const {reservation_id}=req.body.data;
    let reservation = await resService.read(reservation_id);
    let updatedRes = {...reservation,status:"seated"}
    await service.reservationSeat(updatedRes);
    next();
}

async function finishReservation(req,res,next){
    const table_id = req.params.table_id;
    const table = await service.read(table_id);
    const reservation = await resService.read(table.reservation_id);
    let updatedReservation = {...reservation,status:"finished"};
    await resService.update(updatedReservation);
    next();
}

async function finish(req,res,next){
    const table_id = req.params.table_id;
    let table = await service.read(table_id);
    let updatedTable = await service.finish({...table,reservation_id:null,occupied:false});
    res.json({data:updatedTable});
}

module.exports ={
    list:[asyncErrorBoundary(list)],
    create:[
        asyncErrorBoundary(hasProperties("table_name","capacity")),
        asyncErrorBoundary(checkCapacity),
        asyncErrorBoundary(checkTableName),
        asyncErrorBoundary(create)],
    seat:[
        asyncErrorBoundary(hasProperties("reservation_id")),
        asyncErrorBoundary(reservationExists),
        asyncErrorBoundary(checkOccupiedStatus),
        asyncErrorBoundary(checkTableCapacity),
        asyncErrorBoundary(checkIfReservationIsBooked),
        asyncErrorBoundary(seatReservation),
        asyncErrorBoundary(seat)
    ],
    finish:[
        asyncErrorBoundary(tableExists),
        asyncErrorBoundary(checkSeatedStatus),
        asyncErrorBoundary(finishReservation),
        asyncErrorBoundary(finish)],
};