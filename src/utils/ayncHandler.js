//syntax 1
const asynHandler = (requestHandler)=>{
   return  (req,res,next) =>
        Promise.
    resolve(requestHandler(req,res,next)).
    catch((err)=>next(err))
    
}
export  {asynHandler}
// syntax 2
/*
const AsynHandler = (fn) => async(req, res, next)=>{
    try {
        await fn(req,res,next);
        
    } catch (error) {
        res.status(error.code || 500).json({
            sucess:false,
            message:error.message
        })
    }

}
*/