
import Foundation

enum RepairCategory: String, CaseIterable, Identifiable, Codable {
    case appliance = "Appliance"
    case plumbing = "Plumbing"
    case electrical = "Electrical"
    case general = "General"
    
    var id: String { self.rawValue }
    
    var iconName: String {
        switch self {
        case .appliance: return "washer.fill"
        case .plumbing: return "drop.fill"
        case .electrical: return "bolt.fill"
        case .general: return "hammer.fill"
        }
    }
}

struct RepairService: Identifiable, Codable, Hashable {
    let id: UUID
    let name: String
    let category: RepairCategory
    let description: String
    let priceRange: String
    let rating: Double
    let iconName: String
    var isSaved: Bool = false
    
    static let mockData: [RepairService] = [
        RepairService(id: UUID(), name: "Refrigerator Diagnostic", category: .appliance, description: "Professional diagnostic and cooling system repair for all major brands.", priceRange: "$80 - $200", rating: 4.8, iconName: "refrigerator.fill"),
        RepairService(id: UUID(), name: "Clogged Drain Clearing", category: .plumbing, description: "Fast and effective removal of blockages in sinks, tubs, and main lines.", priceRange: "$100 - $250", rating: 4.9, iconName: "sink.fill"),
        RepairService(id: UUID(), name: "Outlet Installation", category: .electrical, description: "Safe installation or replacement of wall outlets and GFCIs.", priceRange: "$75 - $150", rating: 4.7, iconName: "poweroutlet.type.b.fill"),
        RepairService(id: UUID(), name: "Dishwasher Repair", category: .appliance, description: "Fixes for leaks, drainage issues, and cycle failures.", priceRange: "$120 - $300", rating: 4.6, iconName: "dishwasher.fill")
    ]
}
