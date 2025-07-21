import { DataType, DataTypes, Model } from "sequelize";
import sequelize from '../config/database';

class Context extends Model {}

Context.init({
    sessionId: {type: DataTypes.UUID, primaryKey: true},
    userId: {type: DataTypes.UUID, allowNull: false},
    context_data: {type: DataTypes.JSONB, allowNull: false}
}, {
    sequelize,
    tableName: 'Contexts',
    modelName: 'Context'
});

export default Context;