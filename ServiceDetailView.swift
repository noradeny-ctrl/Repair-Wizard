
import SwiftUI

struct ServiceDetailView: View {
    let service: RepairService
    @ObservedObject var viewModel: RepairViewModel
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                ZStack(alignment: .topTrailing) {
                    Rectangle()
                        .fill(Color.blue.gradient)
                        .frame(height: 200)
                        .overlay {
                            Image(systemName: service.iconName)
                                .font(.system(size: 80))
                                .foregroundColor(.white)
                        }
                    
                    Button {
                        viewModel.toggleSave(service: service)
                    } label: {
                        Image(systemName: service.isSaved ? "heart.fill" : "heart")
                            .font(.title2)
                            .padding()
                            .background(.ultraThinMaterial)
                            .clipShape(Circle())
                            .foregroundColor(service.isSaved ? .red : .white)
                    }
                    .padding()
                }
                
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Text(service.category.rawValue)
                            .font(.caption)
                            .bold()
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.blue.opacity(0.1))
                            .foregroundColor(.blue)
                            .cornerRadius(8)
                        
                        Spacer()
                        
                        Label(String(format: "%.1f", service.rating), systemImage: "star.fill")
                            .foregroundColor(.orange)
                            .bold()
                    }
                    
                    Text(service.name)
                        .font(.largeTitle)
                        .bold()
                    
                    Text("Starting from \(service.priceRange)")
                        .font(.title3)
                        .foregroundColor(.green)
                        .bold()
                    
                    Divider()
                    
                    Text("About this service")
                        .font(.headline)
                    
                    Text(service.description)
                        .font(.body)
                        .foregroundColor(.secondary)
                        .lineSpacing(6)
                    
                    Spacer(minLength: 40)
                    
                    Button {
                        // Booking Logic Stub
                    } label: {
                        Text("Book Now")
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .cornerRadius(16)
                    }
                    .shadow(color: .blue.opacity(0.3), radius: 10, x: 0, y: 5)
                }
                .padding()
            }
        }
        .ignoresSafeArea(edges: .top)
        .navigationBarTitleDisplayMode(.inline)
    }
}
