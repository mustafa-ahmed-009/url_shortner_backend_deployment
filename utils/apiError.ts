class ApiError extends Error {
    statusCode:number ;  
    status : "fail" | "error" ; 
    constructor (message:string, statusCode:number){
        super(message) ; 
        this.statusCode = statusCode ; 
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error" ; 

    }
    
}
export default ApiError ; 