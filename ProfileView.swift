
import SwiftUI

struct ProfileView: View {
    @ObservedObject var viewModel: RepairViewModel
    
    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack(spacing: 16) {
                        Image(systemName: "person.crop.circle.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        
                        VStack(alignment: .leading) {
                            Text("Wizard User")
                                .font(.headline)
                            Text("user@repairwizard.ai")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 8)
                }
                
                Section("Saved Repairs") {
                    if viewModel.savedServices.isEmpty {
                        Text("No saved repairs yet.")
                            .foregroundColor(.secondary)
                            .font(.subheadline)
                    } else {
                        ForEach(viewModel.savedServices) { service in
                            NavigationLink(destination: ServiceDetailView(service: service, viewModel: viewModel)) {
                                Label(service.name, systemImage: service.iconName)
                            }
                        }
                    }
                }
                
                Section("Settings") {
                    Label("Payment Methods", systemImage: "creditcard")
                    Label("Notification Settings", systemImage: "bell")
                    Label("Support", systemImage: "questionmark.circle")
                }
            }
            .navigationTitle("Profile")
        }
    }
}
