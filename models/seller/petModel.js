const sequelizeConfig=require('../../config/sequelize.config');
const {DataTypes}=require('sequelize');
const sellerModel = require('./sellerModel');

const petModel=sequelizeConfig.define('pets',{
    id:{
        type:DataTypes.STRING,
        allowNull:false,
        defaultValue:DataTypes.UUIDV4,
        primaryKey:true
    },
    name:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    breed:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    color:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    age:{
        type:DataTypes.INTEGER,
        allowNull:false,
    },
    sellerId:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    description:{
        type:DataTypes.TEXT,
        allowNull:false,
    },
    quantity:{
        type:DataTypes.INTEGER,
        allowNull:false,
    },
    total:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    sell:{
        type:DataTypes.INTEGER,
        allowNull:false
    },
    img:{
        type:DataTypes.STRING,
        allowNull:false,
    },
    sold:{
        type:DataTypes.BOOLEAN,
        allowNull:false,
    }
});


petModel.associate=()=>{
    petModel.belongsTo(sellerModel,{foreignKey:"sellerId"});
};

module.exports=petModel