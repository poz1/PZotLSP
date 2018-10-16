export class Logger{

    private static debugEnabled:boolean = true;

    public static log(message:string){
        if(this.debugEnabled)
            console.log(message);
    }
}