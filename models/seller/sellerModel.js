const sequelizeConfig=require('../../config/sequelize.config');
const {DataTypes}=require('sequelize');
const petModel = require('./petModel');

const sellerModel=sequelizeConfig.define('sellerlogin',{
    id:{
        type:DataTypes.STRING,
        primaryKey:true,
        defaultValue:DataTypes.UUIDV4,
        allowNull:false
    },
    name:{
        type:DataTypes.STRING,
        allowNull:false
    },
    email:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    password:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    contact:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    place:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    verify:{
        type:DataTypes.BOOLEAN,
        allowNull:false,
    }
});


module.exports=sellerModel;