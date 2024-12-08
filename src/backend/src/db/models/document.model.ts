// @package sequelize v6.31.0
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../config/database.config';
import { DocumentTypes, DocumentStatus, DocumentCategory } from '../types/document.types';
import { UserModel } from './user.model';
import { DelegateModel } from './delegate.model';
import { PermissionModel } from './permission.model';
import { encryptData } from '../utils/encryption.util';
import { logInfo, logError } from '../utils/logger.util';

/**
 * Human Tasks:
 * 1. Ensure database connection is properly configured in database.config.ts
 * 2. Verify that the encryption key is set in environment variables
 * 3. Review cascade delete behavior for document relationships
 * 4. Configure document storage limits and quotas
 * 5. Set up backup policies for document metadata
 */

// Interface for Document attributes during creation
interface DocumentCreationAttributes extends Optional<DocumentTypes, 'documentId'> {}

/**
 * Sequelize model for the Document entity
 * Requirements Addressed:
 * - Document Management (Technical Specifications/1.3 Scope/In-Scope/Core Features)
 *   Implements the database model for managing documents, including metadata and categories
 * - Data Security (Technical Specifications/1.3 Scope/In-Scope/Data Security)
 *   Ensures secure handling of document metadata through encryption
 */
export class DocumentModel extends Model<DocumentTypes, DocumentCreationAttributes> implements DocumentTypes {
  public documentId!: string;
  public title!: string;
  public category!: string;
  public status!: string;
  public metadata!: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * Defines the relationships between the Document model and other models
   * @param models - The models object containing all models in the application
   */
  public static associate(models: any): void {
    // Relationship with User model
    DocumentModel.belongsTo(UserModel, {
      foreignKey: 'userId',
      as: 'owner',
      onDelete: 'CASCADE'
    });

    // Many-to-many relationship with Delegate model through permissions
    DocumentModel.belongsToMany(DelegateModel, {
      through: PermissionModel,
      foreignKey: 'documentId',
      otherKey: 'delegateId',
      as: 'delegates'
    });

    // One-to-many relationship with Permission model
    DocumentModel.hasMany(PermissionModel, {
      foreignKey: 'documentId',
      as: 'permissions'
    });
  }

  /**
   * Validates document data before saving to the database
   * @param documentData - The document data to validate
   * @returns boolean indicating if the data is valid
   * @throws Error if validation fails
   */
  public static validateDocumentData(documentData: DocumentTypes): boolean {
    try {
      // Validate required fields
      if (!documentData.title || !documentData.category || !documentData.status) {
        throw new Error('Missing required fields');
      }

      // Validate category
      if (!Object.values(DocumentCategory).includes(documentData.category as DocumentCategory)) {
        throw new Error('Invalid document category');
      }

      // Validate status
      if (!Object.values(DocumentStatus).includes(documentData.status as DocumentStatus)) {
        throw new Error('Invalid document status');
      }

      // Validate metadata structure
      if (documentData.metadata && typeof documentData.metadata !== 'object') {
        throw new Error('Invalid metadata format');
      }

      logInfo(`Document validation successful for title: ${documentData.title}`);
      return true;
    } catch (error) {
      logError(error as Error);
      throw error;
    }
  }
}

// Initialize the Document model with its schema
DocumentModel.init(
  {
    documentId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value: string) {
        // Encrypt title before storing
        this.setDataValue('title', encryptData(value));
      }
    },
    category: {
      type: DataTypes.ENUM(...Object.values(DocumentCategory)),
      allowNull: false,
      validate: {
        isIn: [Object.values(DocumentCategory)]
      }
    },
    status: {
      type: DataTypes.ENUM(...Object.values(DocumentStatus)),
      allowNull: false,
      defaultValue: DocumentStatus.DRAFT,
      validate: {
        isIn: [Object.values(DocumentStatus)]
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      set(value: Record<string, any>) {
        // Encrypt sensitive metadata fields
        const encryptedMetadata = {
          ...value,
          originalName: value.originalName ? encryptData(value.originalName) : undefined
        };
        this.setDataValue('metadata', encryptedMetadata);
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'documents',
    timestamps: true,
    indexes: [
      {
        fields: ['category']
      },
      {
        fields: ['status']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['createdAt']
      }
    ]
  }
);

export default DocumentModel;