// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title APIRegistry
 * @dev Central registry for all monetizable APIs in the AgentPayyKit ecosystem
 * @notice This contract is the single source of truth for API discovery
 */
contract APIRegistry is Ownable, ReentrancyGuard {
    
    struct APIModel {
        address owner;              // API developer's address
        string endpoint;            // API endpoint URL
        uint256 pricePerCall;      // Price in wei (USDC has 6 decimals)
        address paymentToken;       // Usually USDC
        bool isActive;             // Can be temporarily disabled
        uint256 totalCalls;        // Usage statistics
        uint256 totalRevenue;      // Revenue generated
        uint256 registeredAt;      // Registration timestamp
        string category;           // "Weather", "AI", "Financial", etc.
        string[] tags;             // Searchable tags
    }
    
    // Core storage
    mapping(string => APIModel) public apis;           // modelId => API data
    mapping(address => string[]) public developerAPIs; // developer => list of modelIds
    mapping(string => string[]) public categoryAPIs;   // category => list of modelIds
    
    // Registry state
    string[] public allModelIds;                       // Complete list for enumeration
    string[] public categories;                        // Available categories
    uint256 public totalAPIs;                         // Counter
    uint256 public platformFee = 500;                // 5% in basis points
    
    // Events for indexing and discovery
    event APIRegistered(
        string indexed modelId,
        address indexed owner,
        string endpoint,
        uint256 pricePerCall,
        string category,
        string[] tags,
        uint256 timestamp
    );
    
    event APIUpdated(
        string indexed modelId,
        string endpoint,
        uint256 pricePerCall,
        bool isActive,
        string category
    );
    
    event APICallProcessed(
        string indexed modelId,
        address indexed caller,
        uint256 amount,
        uint256 timestamp
    );
    
    event CategoryAdded(string category);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    
    constructor() Ownable(msg.sender) {
        // Initialize default categories
        categories.push("AI & Machine Learning");
        categories.push("Weather & Environment");
        categories.push("Financial Data");
        categories.push("Crypto & Blockchain");
        categories.push("Image Processing");
        categories.push("Text Processing");
        categories.push("Translation");
        categories.push("General");
    }
    
    /**
     * @dev Register a new API in the registry
     * @param modelId Unique identifier for the API
     * @param endpoint API endpoint URL
     * @param pricePerCall Price per API call in USDC (6 decimals)
     * @param paymentToken Token address (usually USDC)
     * @param category API category
     * @param tags Array of searchable tags
     */
    function registerAPI(
        string calldata modelId,
        string calldata endpoint,
        uint256 pricePerCall,
        address paymentToken,
        string calldata category,
        string[] calldata tags
    ) external {
        require(bytes(modelId).length > 0 && bytes(modelId).length <= 64, "Invalid modelId");
        require(bytes(endpoint).length > 0, "Endpoint required");
        require(pricePerCall > 0, "Price must be > 0");
        require(paymentToken != address(0), "Invalid token");
        require(apis[modelId].owner == address(0), "API already exists");
        require(_isValidCategory(category), "Invalid category");
        require(tags.length > 0 && tags.length <= 10, "1-10 tags required");
        
        // Store API data
        apis[modelId] = APIModel({
            owner: msg.sender,
            endpoint: endpoint,
            pricePerCall: pricePerCall,
            paymentToken: paymentToken,
            isActive: true,
            totalCalls: 0,
            totalRevenue: 0,
            registeredAt: block.timestamp,
            category: category,
            tags: tags
        });
        
        // Update indexes
        allModelIds.push(modelId);
        developerAPIs[msg.sender].push(modelId);
        categoryAPIs[category].push(modelId);
        totalAPIs++;
        
        emit APIRegistered(
            modelId,
            msg.sender,
            endpoint,
            pricePerCall,
            category,
            tags,
            block.timestamp
        );
    }
    
    /**
     * @dev Update an existing API
     */
    function updateAPI(
        string calldata modelId,
        string calldata endpoint,
        uint256 pricePerCall,
        bool isActive,
        string calldata category
    ) external {
        APIModel storage api = apis[modelId];
        require(api.owner == msg.sender, "Not owner");
        require(bytes(endpoint).length > 0, "Endpoint required");
        require(pricePerCall > 0, "Price must be > 0");
        require(_isValidCategory(category), "Invalid category");
        
        // Update category index if changed
        if (keccak256(bytes(api.category)) != keccak256(bytes(category))) {
            _removeFromCategory(modelId, api.category);
            categoryAPIs[category].push(modelId);
        }
        
        api.endpoint = endpoint;
        api.pricePerCall = pricePerCall;
        api.isActive = isActive;
        api.category = category;
        
        emit APIUpdated(modelId, endpoint, pricePerCall, isActive, category);
    }
    
    /**
     * @dev Record an API call (called by payment processor)
     */
    function recordAPICall(
        string calldata modelId,
        address caller,
        uint256 amount
    ) external {
        // In a real implementation, this would be called by the payment processor
        // For now, we'll allow anyone to call it for demo purposes
        APIModel storage api = apis[modelId];
        require(api.owner != address(0), "API not found");
        require(amount >= api.pricePerCall, "Insufficient payment");
        
        api.totalCalls++;
        api.totalRevenue += amount;
        
        emit APICallProcessed(modelId, caller, amount, block.timestamp);
    }
    
    /**
     * @dev Get API by modelId
     */
    function getAPI(string calldata modelId) external view returns (APIModel memory) {
        return apis[modelId];
    }
    
    /**
     * @dev Get all APIs by a developer
     */
    function getDeveloperAPIs(address developer) external view returns (string[] memory) {
        return developerAPIs[developer];
    }
    
    /**
     * @dev Get all APIs in a category
     */
    function getCategoryAPIs(string calldata category) external view returns (string[] memory) {
        return categoryAPIs[category];
    }
    
    /**
     * @dev Get all available categories
     */
    function getCategories() external view returns (string[] memory) {
        return categories;
    }
    
    /**
     * @dev Get paginated list of all APIs
     */
    function getAPIs(uint256 offset, uint256 limit) external view returns (string[] memory) {
        require(offset < allModelIds.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > allModelIds.length) {
            end = allModelIds.length;
        }
        
        string[] memory result = new string[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = allModelIds[i];
        }
        
        return result;
    }
    
    /**
     * @dev Get registry statistics
     */
    function getStats() external view returns (
        uint256 totalRegistered,
        uint256 totalCategories,
        uint256 totalDevelopers,
        uint256 totalCalls,
        uint256 totalRevenue
    ) {
        totalRegistered = totalAPIs;
        totalCategories = categories.length;
        
        // Count unique developers
        uint256 developerCount = 0;
        // This is expensive, would be optimized in production
        
        // Sum all calls and revenue
        uint256 callSum = 0;
        uint256 revenueSum = 0;
        
        for (uint256 i = 0; i < allModelIds.length; i++) {
            APIModel storage api = apis[allModelIds[i]];
            callSum += api.totalCalls;
            revenueSum += api.totalRevenue;
        }
        
        totalDevelopers = developerCount; // Would be tracked properly
        totalCalls = callSum;
        totalRevenue = revenueSum;
    }
    
    /**
     * @dev Search APIs by tag (simple implementation)
     */
    function searchByTag(string calldata tag) external view returns (string[] memory) {
        string[] memory results = new string[](allModelIds.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < allModelIds.length; i++) {
            string memory modelId = allModelIds[i];
            APIModel storage api = apis[modelId];
            
            // Check if tag exists in API tags
            for (uint256 j = 0; j < api.tags.length; j++) {
                if (keccak256(bytes(api.tags[j])) == keccak256(bytes(tag))) {
                    results[count] = modelId;
                    count++;
                    break;
                }
            }
        }
        
        // Resize array to actual count
        string[] memory finalResults = new string[](count);
        for (uint256 i = 0; i < count; i++) {
            finalResults[i] = results[i];
        }
        
        return finalResults;
    }
    
    /**
     * @dev Add a new category (admin only)
     */
    function addCategory(string calldata category) external onlyOwner {
        require(bytes(category).length > 0, "Category required");
        require(!_isValidCategory(category), "Category exists");
        
        categories.push(category);
        emit CategoryAdded(category);
    }
    
    /**
     * @dev Update platform fee (admin only)
     */
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        uint256 oldFee = platformFee;
        platformFee = newFee;
        emit PlatformFeeUpdated(oldFee, newFee);
    }
    
    /**
     * @dev Check if category is valid
     */
    function _isValidCategory(string calldata category) internal view returns (bool) {
        for (uint256 i = 0; i < categories.length; i++) {
            if (keccak256(bytes(categories[i])) == keccak256(bytes(category))) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Remove API from category index
     */
    function _removeFromCategory(string calldata modelId, string memory category) internal {
        string[] storage categoryList = categoryAPIs[category];
        for (uint256 i = 0; i < categoryList.length; i++) {
            if (keccak256(bytes(categoryList[i])) == keccak256(bytes(modelId))) {
                categoryList[i] = categoryList[categoryList.length - 1];
                categoryList.pop();
                break;
            }
        }
    }
} 