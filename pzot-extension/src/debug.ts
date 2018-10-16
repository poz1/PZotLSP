export class Logger{

    private static debugEnabled:boolean = true;

    public static log(obj?:any, message?:string){
        if(this.debugEnabled){
            console.log(message);
            console.log(obj);
        }
    }
}