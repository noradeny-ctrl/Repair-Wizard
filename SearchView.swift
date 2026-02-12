
import SwiftUI

struct SearchView: View {
    @ObservedObject var viewModel: RepairViewModel
    
    var body: some View {
        NavigationStack {
            List(viewModel.filteredServices) { service in
                NavigationLink(value: service) {
                    VStack(alignment: .leading) {
                        Text(service.name)
                            .font(.headline)
                        Text(service.category.rawValue)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Search")
            .searchable(text: $viewModel.searchText, prompt: "Repair service, brand...")
            .navigationDestination(for: RepairService.self) { service in
                ServiceDetailView(service: service, viewModel: viewModel)
            }
            .overlay {
                if viewModel.filteredServices.isEmpty {
                    ContentUnavailableView.search(text: viewModel.searchText)
                }
            }
        }
    }
}
