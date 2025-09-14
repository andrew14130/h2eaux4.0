from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import bcrypt
from jose import JWTError, jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'h2eaux-secret-key-2025')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer()

app = FastAPI(title="H2EAUX Gestion API")
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    role: str = "employee"  # admin or employee
    permissions: dict = Field(default_factory=lambda: {
        "clients": True,
        "documents": True,
        "chantiers": True,
        "calculs_pac": True,
        "catalogues": True,
        "chat": True,
        "parametres": False
    })
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "employee"

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    permissions: dict
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class Client(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    prenom: str
    telephone: str = ""
    email: str = ""
    adresse: str = ""
    ville: str = ""
    code_postal: str = ""
    type_chauffage: str = ""
    notes: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ClientCreate(BaseModel):
    nom: str
    prenom: str
    telephone: str = ""
    email: str = ""
    adresse: str = ""
    ville: str = ""
    code_postal: str = ""
    type_chauffage: str = ""
    notes: str = ""

class ClientUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    adresse: Optional[str] = None
    ville: Optional[str] = None
    code_postal: Optional[str] = None
    type_chauffage: Optional[str] = None
    notes: Optional[str] = None

class Chantier(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    adresse: str = ""
    ville: str = ""
    code_postal: str = ""
    client_nom: str
    client_telephone: str = ""
    type_travaux: str = ""
    statut: str = "en_attente"  # en_attente, en_cours, termine, annule
    date_debut: str = ""
    date_fin_prevue: str = ""
    date_fin_reelle: str = ""
    budget_estime: str = ""
    budget_final: str = ""
    description: str = ""
    notes: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ChantierCreate(BaseModel):
    nom: str
    adresse: str = ""
    ville: str = ""
    code_postal: str = ""
    client_nom: str
    client_telephone: str = ""
    type_travaux: str = ""
    statut: str = "en_attente"
    date_debut: str = ""
    date_fin_prevue: str = ""
    budget_estime: str = ""
    description: str = ""

class ChantierUpdate(BaseModel):
    nom: Optional[str] = None
    adresse: Optional[str] = None
    ville: Optional[str] = None
    code_postal: Optional[str] = None
    client_nom: Optional[str] = None
    client_telephone: Optional[str] = None
    type_travaux: Optional[str] = None
    statut: Optional[str] = None
    date_debut: Optional[str] = None
    date_fin_prevue: Optional[str] = None
    date_fin_reelle: Optional[str] = None
    budget_estime: Optional[str] = None
    budget_final: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None

class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    type: str = "autre"  # facture, devis, contrat, fiche_technique, rapport, autre
    client_nom: str = ""
    chantier_nom: str = ""
    description: str = ""
    tags: str = ""
    file_path: str = ""
    file_size: int = 0
    mime_type: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DocumentCreate(BaseModel):
    nom: str
    type: str = "autre"
    client_nom: str = ""
    chantier_nom: str = ""
    description: str = ""
    tags: str = ""

class DocumentUpdate(BaseModel):
    nom: Optional[str] = None
    type: Optional[str] = None
    client_nom: Optional[str] = None
    chantier_nom: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[str] = None

# Utility functions
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return User(**user)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Initialize default admin user
async def init_default_users():
    admin_exists = await db.users.find_one({"username": "admin"})
    if not admin_exists:
        admin_user = User(
            username="admin",
            role="admin",
            permissions={
                "clients": True,
                "documents": True,
                "chantiers": True,
                "calculs_pac": True,
                "catalogues": True,
                "chat": True,
                "parametres": True
            },
            hashed_password=hash_password("admin123")
        )
        await db.users.insert_one(admin_user.dict())
        
    # Create a sample employee
    employee_exists = await db.users.find_one({"username": "employe1"})
    if not employee_exists:
        employee_user = User(
            username="employe1",
            role="employee",
            permissions={
                "clients": True,
                "documents": True,
                "chantiers": True,
                "calculs_pac": True,
                "catalogues": True,
                "chat": True,
                "parametres": False
            },
            hashed_password=hash_password("employe123")
        )
        await db.users.insert_one(employee_user.dict())

# Auth routes
@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"username": user_data.username})
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(
        id=user["id"],
        username=user["username"],
        role=user["role"],
        permissions=user["permissions"],
        created_at=user["created_at"].isoformat()
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, current_user: User = Depends(get_current_user)):
    # Only admin can create new users
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can create new users"
        )
    
    # Check if user already exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    new_user = User(
        username=user_data.username,
        role=user_data.role,
        hashed_password=hash_password(user_data.password)
    )
    
    await db.users.insert_one(new_user.dict())
    
    return UserResponse(
        id=new_user.id,
        username=new_user.username,
        role=new_user.role,
        permissions=new_user.permissions,
        created_at=new_user.created_at.isoformat()
    )

# Client routes
@api_router.get("/clients", response_model=List[Client])
async def get_clients(current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("clients", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to clients not permitted"
        )
    
    clients = await db.clients.find().sort("created_at", -1).to_list(1000)
    return [Client(**client) for client in clients]

@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientCreate, current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("clients", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to clients not permitted"
        )
    
    new_client = Client(**client_data.dict())
    await db.clients.insert_one(new_client.dict())
    return new_client

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str, current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("clients", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to clients not permitted"
        )
    
    client = await db.clients.find_one({"id": client_id})
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return Client(**client)

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(
    client_id: str, 
    client_data: ClientUpdate, 
    current_user: User = Depends(get_current_user)
):
    if not current_user.permissions.get("clients", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to clients not permitted"
        )
    
    client = await db.clients.find_one({"id": client_id})
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    update_data = {k: v for k, v in client_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.clients.update_one({"id": client_id}, {"$set": update_data})
    
    updated_client = await db.clients.find_one({"id": client_id})
    return Client(**updated_client)

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("clients", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to clients not permitted"
        )
    
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return {"message": "Client deleted successfully"}

# Chantier routes
@api_router.get("/chantiers", response_model=List[Chantier])
async def get_chantiers(current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("chantiers", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to chantiers not permitted"
        )
    
    chantiers = await db.chantiers.find().sort("created_at", -1).to_list(1000)
    return [Chantier(**chantier) for chantier in chantiers]

@api_router.post("/chantiers", response_model=Chantier)
async def create_chantier(chantier_data: ChantierCreate, current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("chantiers", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to chantiers not permitted"
        )
    
    new_chantier = Chantier(**chantier_data.dict())
    await db.chantiers.insert_one(new_chantier.dict())
    return new_chantier

@api_router.get("/chantiers/{chantier_id}", response_model=Chantier)
async def get_chantier(chantier_id: str, current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("chantiers", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to chantiers not permitted"
        )
    
    chantier = await db.chantiers.find_one({"id": chantier_id})
    if not chantier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chantier not found"
        )
    return Chantier(**chantier)

@api_router.put("/chantiers/{chantier_id}", response_model=Chantier)
async def update_chantier(
    chantier_id: str, 
    chantier_data: ChantierUpdate, 
    current_user: User = Depends(get_current_user)
):
    if not current_user.permissions.get("chantiers", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to chantiers not permitted"
        )
    
    chantier = await db.chantiers.find_one({"id": chantier_id})
    if not chantier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chantier not found"
        )
    
    update_data = {k: v for k, v in chantier_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.chantiers.update_one({"id": chantier_id}, {"$set": update_data})
    
    updated_chantier = await db.chantiers.find_one({"id": chantier_id})
    return Chantier(**updated_chantier)

@api_router.delete("/chantiers/{chantier_id}")
async def delete_chantier(chantier_id: str, current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("chantiers", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to chantiers not permitted"
        )
    
    result = await db.chantiers.delete_one({"id": chantier_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chantier not found"
        )
    return {"message": "Chantier deleted successfully"}

# Document routes
@api_router.get("/documents", response_model=List[Document])
async def get_documents(current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("documents", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to documents not permitted"
        )
    
    documents = await db.documents.find().sort("created_at", -1).to_list(1000)
    return [Document(**document) for document in documents]

@api_router.post("/documents", response_model=Document)
async def create_document(document_data: DocumentCreate, current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("documents", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to documents not permitted"
        )
    
    new_document = Document(**document_data.dict())
    await db.documents.insert_one(new_document.dict())
    return new_document

@api_router.get("/documents/{document_id}", response_model=Document)
async def get_document(document_id: str, current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("documents", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to documents not permitted"
        )
    
    document = await db.documents.find_one({"id": document_id})
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    return Document(**document)

@api_router.put("/documents/{document_id}", response_model=Document)
async def update_document(
    document_id: str, 
    document_data: DocumentUpdate, 
    current_user: User = Depends(get_current_user)
):
    if not current_user.permissions.get("documents", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to documents not permitted"
        )
    
    document = await db.documents.find_one({"id": document_id})
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    update_data = {k: v for k, v in document_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.documents.update_one({"id": document_id}, {"$set": update_data})
    
    updated_document = await db.documents.find_one({"id": document_id})
    return Document(**updated_document)

@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str, current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("documents", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to documents not permitted"
        )
    
    result = await db.documents.delete_one({"id": document_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    return {"message": "Document deleted successfully"}

# User management routes
@api_router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("parametres", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to user management not permitted"
        )
    
    users = await db.users.find().sort("created_at", -1).to_list(1000)
    return [UserResponse(
        id=user["id"],
        username=user["username"],
        role=user["role"],
        permissions=user["permissions"],
        created_at=user["created_at"].isoformat()
    ) for user in users]

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("parametres", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to user management not permitted"
        )
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user["id"],
        username=user["username"],
        role=user["role"],
        permissions=user["permissions"],
        created_at=user["created_at"].isoformat()
    )

class UserUpdate(BaseModel):
    role: Optional[str] = None
    permissions: Optional[dict] = None

@api_router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str, 
    user_data: UserUpdate, 
    current_user: User = Depends(get_current_user)
):
    if not current_user.permissions.get("parametres", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to user management not permitted"
        )
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    update_data = {k: v for k, v in user_data.dict().items() if v is not None}
    
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user_id})
    return UserResponse(
        id=updated_user["id"],
        username=updated_user["username"],
        role=updated_user["role"],
        permissions=updated_user["permissions"],
        created_at=updated_user["created_at"].isoformat()
    )

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("parametres", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access to user management not permitted"
        )
    
    # Prevent deletion of current user
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return {"message": "User deleted successfully"}

# Fiche SDB Models - Extended for Chantier functionality
class FicheSDB(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    client_nom: str
    adresse: str = ""
    telephone: str = ""
    email: str = ""
    
    # SDB original fields
    type_sdb: str = "complete"  # complete, douche, wc, mixte, visite_technique, releve_existant, installation, maintenance
    surface: str = ""
    carrelage_mur: str = ""
    carrelage_sol: str = ""
    sanitaires: str = ""
    robinetterie: str = ""
    chauffage: str = ""
    ventilation: str = ""
    eclairage: str = ""
    budget_estime: str = ""
    notes: str = ""
    
    # Extended Chantier fields (8 tabs support)
    date_rdv: str = ""
    type_intervention: str = ""
    statut: str = ""
    nb_personnes: int = 1
    type_logement: str = ""
    annee_construction: int = 0
    isolation: str = ""
    menuiseries: str = ""
    chauffage_actuel: str = ""
    etat_general: str = ""
    production_ecs: str = ""
    observations_existant: str = ""
    besoins: str = ""
    priorite: str = ""
    delai_souhaite: str = ""
    contraintes: str = ""
    compteur_electrique: str = ""
    arrivee_gaz: str = ""
    evacuation_eaux: str = ""
    acces_materiel: str = ""
    contraintes_techniques: str = ""
    plan_data: str = ""  # JSON string for 2D plan data
    solution_recommandee: str = ""
    points_attention: str = ""
    budget_final: str = ""
    delai_realisation: str = ""
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FicheSDBCreate(BaseModel):
    nom: str
    client_nom: str
    adresse: str = ""
    telephone: str = ""
    email: str = ""
    type_sdb: str = "complete"
    surface: str = ""
    carrelage_mur: str = ""
    carrelage_sol: str = ""
    sanitaires: str = ""
    robinetterie: str = ""
    chauffage: str = ""
    ventilation: str = ""
    eclairage: str = ""
    budget_estime: str = ""
    notes: str = ""
    
    # Extended fields for chantier support
    date_rdv: str = ""
    type_intervention: str = ""
    statut: str = ""
    nb_personnes: int = 1
    type_logement: str = ""
    annee_construction: int = 0
    isolation: str = ""
    menuiseries: str = ""
    chauffage_actuel: str = ""
    etat_general: str = ""
    production_ecs: str = ""
    observations_existant: str = ""
    besoins: str = ""
    priorite: str = ""
    delai_souhaite: str = ""
    contraintes: str = ""
    compteur_electrique: str = ""
    arrivee_gaz: str = ""
    evacuation_eaux: str = ""
    acces_materiel: str = ""
    contraintes_techniques: str = ""
    plan_data: str = ""
    solution_recommandee: str = ""
    points_attention: str = ""
    budget_final: str = ""
    delai_realisation: str = ""

class FicheSDBUpdate(BaseModel):
    nom: Optional[str] = None
    client_nom: Optional[str] = None
    adresse: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    type_sdb: Optional[str] = None
    surface: Optional[str] = None
    carrelage_mur: Optional[str] = None
    carrelage_sol: Optional[str] = None
    sanitaires: Optional[str] = None
    robinetterie: Optional[str] = None
    chauffage: Optional[str] = None
    ventilation: Optional[str] = None
    eclairage: Optional[str] = None
    budget_estime: Optional[str] = None
    notes: Optional[str] = None
    
    # Extended fields for chantier support
    date_rdv: Optional[str] = None
    type_intervention: Optional[str] = None
    statut: Optional[str] = None
    nb_personnes: Optional[int] = None
    type_logement: Optional[str] = None
    annee_construction: Optional[int] = None
    isolation: Optional[str] = None
    menuiseries: Optional[str] = None
    chauffage_actuel: Optional[str] = None
    etat_general: Optional[str] = None
    production_ecs: Optional[str] = None
    observations_existant: Optional[str] = None
    besoins: Optional[str] = None
    priorite: Optional[str] = None
    delai_souhaite: Optional[str] = None
    contraintes: Optional[str] = None
    compteur_electrique: Optional[str] = None
    arrivee_gaz: Optional[str] = None
    evacuation_eaux: Optional[str] = None
    acces_materiel: Optional[str] = None
    contraintes_techniques: Optional[str] = None
    plan_data: Optional[str] = None
    solution_recommandee: Optional[str] = None
    points_attention: Optional[str] = None
    budget_final: Optional[str] = None
    delai_realisation: Optional[str] = None

# Models aligned for 8-tab Fiches Chantier support
# Using FicheSDB as the unified model for compatibility

# Calcul PAC Models - Version étendue
class Piece(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    type: str = "salon"
    
    # Dimensions et calculs automatiques
    longueur: str = ""  # Longueur en mètres
    largeur: str = ""   # Largeur en mètres
    hauteur: str = "2.5"  # Hauteur en mètres
    surface: str = ""   # Surface auto-calculée (L×l)
    volume: str = ""    # Volume auto-calculé (L×l×h)
    
    # Températures et deltas
    temperature_souhaitee: str = "20"
    temperature_exterieure: str = "-7"
    delta_t: str = ""   # Auto-calculé (T_int - T_ext)
    
    # Calculs techniques
    coefficient_g: str = "1.0"  # Selon isolation et zone
    ratio_norme_energetique: str = "1.0"
    puissance_calculee: str = ""  # Auto-calculée (Surface × Coeff G × ΔT × Ratio)
    
    # Caractéristiques thermiques
    orientation: str = "sud"
    isolation_mur: str = "bonne"
    isolation_sol: str = "bonne"
    isolation_plafond: str = "bonne"
    
    # Ouvertures
    nombre_fenetres: int = 1
    surface_fenetres: str = ""
    type_vitrage: str = "double"
    surface_vitree: str = ""
    
    # Radiateurs existants (pour Air/Eau)
    radiateurs_existants: str = ""
    type_materiau_radiateur: str = "fonte"  # fonte, acier, aluminium
    dimensions_radiateur: str = ""  # Format: H×L×P (ex: 60×120×10)
    nombre_radiateurs: int = 0
    
    # Unités intérieures (pour Air/Air)
    type_unite_interieure: str = "murale"  # murale, cassette, gainable, console
    puissance_unite: str = ""  # Puissance de l'unité intérieure
    temperature_depart: str = "35"  # Pour Air/Eau
    
    # Commentaires
    commentaires: str = ""
    
    # Résultats de calculs
    besoin_chauffage: str = ""
    besoin_climatisation: str = ""

class CalculPACExtended(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nom: str
    
    # Informations générales
    client_nom: str
    adresse: str = ""
    batiment: str = ""  # Nom/type du bâtiment
    
    # Type PAC
    type_pac: str = "air_eau"  # air_eau, air_air, geothermie
    
    # Caractéristiques bâtiment
    surface_totale: str = ""
    altitude: str = "0"  # Altitude en mètres
    zone_climatique: str = "H2"  # H1, H2, H3
    isolation: str = "moyenne"  # rt2012, bonne, moyenne, ancienne, faible
    annee_construction: str = "2000"
    dpe: str = "D"  # A, B, C, D, E, F, G
    document_joint: str = ""  # Chemin vers le document joint
    
    # Températures de base
    temperature_exterieure_base: str = "-7"
    temperature_interieure_souhaitee: str = "20"
    
    # Émetteurs (Air/Eau)
    type_emetteur: str = "radiateurs_bt"  # plancher_chauffant, radiateurs_bt, radiateurs_ht, ventilo_convecteurs
    
    # ECS (Eau Chaude Sanitaire)
    production_ecs: bool = False
    volume_ballon_ecs: str = "200"  # Volume en litres configurable
    puissance_ecs: str = ""  # Puissance calculée pour ECS
    
    # Air/Air spécifique
    type_installation: str = "multi_split"  # mono_split, multi_split, gainable
    scop_estime: str = "4.0"  # Coefficient de performance chauffage
    seer_estime: str = "6.0"  # Coefficient de performance climatisation
    
    # Calculs et résultats
    puissance_calculee: str = ""  # Puissance chauffage calculée
    puissance_totale_calculee: str = ""  # Puissance totale avec ECS
    cop_estime: str = ""  # COP Air/Eau
    consommation_estimee: str = ""
    
    # Gestion pièce par pièce
    pieces: List[Piece] = Field(default_factory=list)
    
    # Informations commerciales
    budget_estime: str = ""
    notes: str = ""
    
    # Legacy fields
    surface_a_chauffer: str = ""
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class CalculPACCreate(BaseModel):
    nom: str
    client_nom: str
    adresse: str = ""
    type_pac: str = "air_eau"
    surface_totale: str = ""
    isolation: str = "moyenne"
    zone_climatique: str = "H2"
    budget_estime: str = ""
    pieces: List[Piece] = Field(default_factory=list)
    notes: str = ""
    temperature_exterieure_base: str = ""
    temperature_interieure_souhaitee: str = ""
    altitude: str = ""
    type_emetteur: str = ""
    production_ecs: bool = False
    volume_ballon_ecs: str = ""
    puissance_calculee: str = ""
    cop_estime: str = ""
    type_installation: str = ""
    puissance_totale_calculee: str = ""
    scop_estime: str = ""
    seer_estime: str = ""

class CalculPACUpdate(BaseModel):
    nom: Optional[str] = None
    client_nom: Optional[str] = None
    adresse: Optional[str] = None
    type_pac: Optional[str] = None
    surface_totale: Optional[str] = None
    isolation: Optional[str] = None
    zone_climatique: Optional[str] = None
    budget_estime: Optional[str] = None
    pieces: Optional[List[Piece]] = None
    notes: Optional[str] = None

# Fiche SDB routes - Updated for 8-tab Fiches Chantier support
@api_router.get("/fiches-sdb", response_model=List[FicheSDB])
async def get_fiches_sdb(current_user: User = Depends(get_current_user)):
    fiches = await db.fiches_sdb.find().sort("created_at", -1).to_list(1000)
    return [FicheSDB(**fiche) for fiche in fiches]

@api_router.post("/fiches-sdb", response_model=FicheSDB)
async def create_fiche_sdb(fiche_data: FicheSDBCreate, current_user: User = Depends(get_current_user)):
    new_fiche = FicheSDB(**fiche_data.dict())
    await db.fiches_sdb.insert_one(new_fiche.dict())
    return new_fiche

@api_router.get("/fiches-sdb/{fiche_id}", response_model=FicheSDB)
async def get_fiche_sdb(fiche_id: str, current_user: User = Depends(get_current_user)):
    fiche = await db.fiches_sdb.find_one({"id": fiche_id})
    if not fiche:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fiche not found")
    return FicheSDB(**fiche)

@api_router.put("/fiches-sdb/{fiche_id}", response_model=FicheSDB)
async def update_fiche_sdb(fiche_id: str, fiche_data: FicheSDBUpdate, current_user: User = Depends(get_current_user)):
    fiche = await db.fiches_sdb.find_one({"id": fiche_id})
    if not fiche:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fiche not found")
    
    update_data = {k: v for k, v in fiche_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.fiches_sdb.update_one({"id": fiche_id}, {"$set": update_data})
    updated_fiche = await db.fiches_sdb.find_one({"id": fiche_id})
    return FicheSDB(**updated_fiche)

@api_router.delete("/fiches-sdb/{fiche_id}")
async def delete_fiche_sdb(fiche_id: str, current_user: User = Depends(get_current_user)):
    result = await db.fiches_sdb.delete_one({"id": fiche_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fiche not found")
    return {"message": "Fiche deleted successfully"}

# Calcul PAC routes - Version étendue
@api_router.get("/calculs-pac", response_model=List[CalculPACExtended])
async def get_calculs_pac(current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("calculs_pac", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access to calculs PAC not permitted")
    
    calculs = await db.calculs_pac.find().sort("created_at", -1).to_list(1000)
    return [CalculPACExtended(**calcul) for calcul in calculs]

@api_router.post("/calculs-pac", response_model=CalculPACExtended)
async def create_calcul_pac(calcul_data: CalculPACCreate, current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("calculs_pac", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access to calculs PAC not permitted")
    
    new_calcul = CalculPACExtended(**calcul_data.dict())
    await db.calculs_pac.insert_one(new_calcul.dict())
    return new_calcul

@api_router.get("/calculs-pac/{calcul_id}", response_model=CalculPACExtended)
async def get_calcul_pac(calcul_id: str, current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("calculs_pac", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access to calculs PAC not permitted")
    
    calcul = await db.calculs_pac.find_one({"id": calcul_id})
    if not calcul:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calcul PAC not found")
    return CalculPACExtended(**calcul)

@api_router.put("/calculs-pac/{calcul_id}", response_model=CalculPACExtended)
async def update_calcul_pac(calcul_id: str, calcul_data: CalculPACUpdate, current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("calculs_pac", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access to calculs PAC not permitted")
    
    calcul = await db.calculs_pac.find_one({"id": calcul_id})
    if not calcul:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calcul PAC not found")
    
    update_data = {k: v for k, v in calcul_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.calculs_pac.update_one({"id": calcul_id}, {"$set": update_data})
    updated_calcul = await db.calculs_pac.find_one({"id": calcul_id})
    return CalculPACExtended(**updated_calcul)

@api_router.delete("/calculs-pac/{calcul_id}")
async def delete_calcul_pac(calcul_id: str, current_user: User = Depends(get_current_user)):
    if not current_user.permissions.get("calculs_pac", False):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access to calculs PAC not permitted")
    
    result = await db.calculs_pac.delete_one({"id": calcul_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calcul PAC not found")
    return {"message": "Calcul PAC deleted successfully"}

# Endpoints removed - using unified /fiches-sdb endpoints

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "ok", "message": "H2EAUX Gestion API is running"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await init_default_users()
    logger.info("H2EAUX Gestion API started successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    logger.info("H2EAUX Gestion API shut down")