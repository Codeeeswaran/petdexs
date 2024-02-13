const sequelizeConfig=require('../../config/sequelize.config');
const {DataTypes}=require('sequelize');

const buyerModel=sequelizeConfig.define('buyerlogin',{
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
    }
});

module.exports=buyerModel;