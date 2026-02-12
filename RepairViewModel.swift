
import SwiftUI
import Combine

@MainActor
class RepairViewModel: ObservableObject {
    @Published var services: [RepairService] = RepairService.mockData
    @Published var searchText: String = ""
    @Published var selectedCategory: RepairCategory? = nil
    
    var filteredServices: [RepairService] {
        services.filter { service in
            let matchesSearch = searchText.isEmpty || service.name.localizedCaseInsensitiveContains(searchText)
            let matchesCategory = selectedCategory == nil || service.category == selectedCategory
            return matchesSearch && matchesCategory
        }
    }
    
    var savedServices: [RepairService] {
        services.filter { $0.isSaved }
    }
    
    func toggleSave(service: RepairService) {
        if let index = services.firstIndex(where: { $0.id == service.id }) {
            services[index].isSaved.toggle()
        }
    }
}
