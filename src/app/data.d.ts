declare module '*/data.json' {
  export interface DataStructure {
    stars: {
      colors: number[];
      names: string[];
    }
  }
  const value: DataStructure;
  export default value;
} 