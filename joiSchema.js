const Joi =require("joi");

const joiSchema=Joi.object({
    title: Joi.string().required(),
    
    about:Joi.string().required(),
   
});

module.exports=joiSchema;