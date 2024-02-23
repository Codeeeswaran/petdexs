const sequelizeConfig=require('../../config/sequelize.config');
const {DataTypes}=require('sequelize');

const adminModel=sequelizeConfig.define('adminlogin',{
    id:{
        type:DataTypes.STRING,
        primaryKey:true,
        defaultValue:DataTypes.UUIDV4,
        allowNull:false
    },
    username:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    email:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    password:{
        type:DataTypes.STRING,
        allowNull:false,
    },
});

module.exports=adminModel;