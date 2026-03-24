export interface Action {
  execute(payload: any, config?: any): any;
}