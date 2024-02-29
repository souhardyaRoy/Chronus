// import { Sequelize, DataTypes, Model, Optional } from 'sequelize';

// interface CityAttributes {
//   city_id: number;
//   city_name: string;
// }

// interface CityCreationAttributes extends Optional<CityAttributes, 'city_id'> {}

// class CityModel extends Model<CityAttributes, CityCreationAttributes> implements CityAttributes {
//   public city_id!: number;
//   public city_name!: string;
// }

// const initCityModel = (sequelize: Sequelize) => {
//   CityModel.init(
//     {
//       city_id: {
//         type: DataTypes.INTEGER,
//         primaryKey: true,
//         autoIncrement: true,
//       },
//       city_name: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//     },
//     {
//       sequelize,
//       tableName: 'city',
//       timestamps: false,
//     }
//   );
// };

// // ... Repeat the same structure for other models ...

// // Association class
// const defineAssociations = () => {
//   CityModel.hasMany(TheatreModel, { foreignKey: 'city_id' });
//   // ... Other associations ...
// };

// class Schema {
//   private sequelize: Sequelize;

//   constructor(sequelize: Sequelize) {
//     this.sequelize = sequelize;
//     this.initModels();
//     this.defineAssociations();
//   }

//   private initModels(): void {
//     initCityModel(this.sequelize);
//     initTheatreModel(this.sequelize);
//     initActiveMoviesModel(this.sequelize);
//     // ... Repeat for other models ...
//   }

//   private defineAssociations(): void {
//     defineAssociations();
//   }

//   public getModels(): {
//     City: typeof CityModel;
//     Theatre: typeof TheatreModel;
//     ActiveMovies: typeof ActiveMoviesModel;
//     // ... Repeat for other models ...
//   } {
//     return {
//       City: CityModel,
//       Theatre: TheatreModel,
//       ActiveMovies: ActiveMoviesModel,
//       // ... Repeat for other models ...
//     };
//   }
// }

// const { City, Theatre, ActiveMovies, ... } = new Schema(equelize).getModels();

// // Now you can use the models as you would normally in your application
