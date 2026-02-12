
import SwiftUI

struct HomeView: View {
    @ObservedObject var viewModel: RepairViewModel
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    headerSection
                    
                    categoryPicker
                    
                    Text("Featured Services")
                        .font(.title2)
                        .bold()
                        .padding(.horizontal)
                    
                    LazyVStack(spacing: 16) {
                        ForEach(viewModel.services) { service in
                            NavigationLink(value: service) {
                                ServiceRow(service: service)
                            }
                            .buttonStyle(PlainButtonStyle())
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .background(Color(UIColor.systemGroupedBackground))
            .navigationTitle("Repair Wizard")
            .navigationDestination(for: RepairService.self) { service in
                ServiceDetailView(service: service, viewModel: viewModel)
            }
        }
    }
    
    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("What can we fix today?")
                .font(.largeTitle)
                .fontWeight(.black)
            
            Text("Find expert help for your home maintenance.")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal)
    }
    
    private var categoryPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(RepairCategory.allCases) { category in
                    CategoryButton(category: category, isSelected: viewModel.selectedCategory == category) {
                        if viewModel.selectedCategory == category {
                            viewModel.selectedCategory = nil
                        } else {
                            viewModel.selectedCategory = category
                        }
                    }
                }
            }
            .padding(.horizontal)
        }
    }
}

struct CategoryButton: View {
    let category: RepairCategory
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: category.iconName)
                    .font(.title2)
                Text(category.rawValue)
                    .font(.caption)
                    .bold()
            }
            .frame(width: 80, height: 80)
            .background(isSelected ? Color.blue : Color(UIColor.secondarySystemGroupedBackground))
            .foregroundColor(isSelected ? .white : .primary)
            .cornerRadius(16)
            .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)
        }
    }
}

struct ServiceRow: View {
    let service: RepairService
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: service.iconName)
                .font(.title)
                .foregroundColor(.blue)
                .frame(width: 60, height: 60)
                .background(Color.blue.opacity(0.1))
                .cornerRadius(12)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(service.name)
                    .font(.headline)
                Text(service.category.rawValue)
                    .font(.caption)
                    .foregroundColor(.secondary)
                HStack {
                    Text(service.priceRange)
                        .font(.subheadline)
                        .foregroundColor(.green)
                        .bold()
                    Spacer()
                    Label(String(format: "%.1f", service.rating), systemImage: "star.fill")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(16)
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 4)
    }
}
