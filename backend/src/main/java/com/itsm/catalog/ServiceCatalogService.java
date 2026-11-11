package com.itsm.catalog;

import com.itsm.catalog.dto.ServiceRequest;
import com.itsm.catalog.dto.ServiceResponse;
import com.itsm.common.exception.DuplicateResourceException;
import com.itsm.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Manages IT services (named ServiceCatalogService to avoid confusion with Spring's @Service). */
@Service
@Transactional
@RequiredArgsConstructor
public class ServiceCatalogService {

    private final ITServiceRepository serviceRepository;
    private final CategoryService categoryService;

    @Transactional(readOnly = true)
    public List<ServiceResponse> list(boolean includeInactive) {
        List<ITService> services = includeInactive
                ? serviceRepository.findAllByOrderByNameAsc()
                : serviceRepository.findAllByActiveTrueOrderByNameAsc();
        return services.stream().map(ServiceResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ServiceResponse getById(Long id) {
        return ServiceResponse.from(find(id));
    }

    public ServiceResponse create(ServiceRequest request) {
        if (serviceRepository.existsByNameIgnoreCase(request.name().trim())) {
            throw new DuplicateResourceException("A service named '" + request.name().trim() + "' already exists");
        }
        ITService saved = serviceRepository.save(new ITService(
                request.name(), request.description(), request.criticality(), resolveCategory(request.defaultCategoryId())));
        return ServiceResponse.from(saved);
    }

    public ServiceResponse update(Long id, ServiceRequest request) {
        ITService service = find(id);
        if (serviceRepository.existsByNameIgnoreCaseAndIdNot(request.name().trim(), id)) {
            throw new DuplicateResourceException("A service named '" + request.name().trim() + "' already exists");
        }
        service.update(request.name(), request.description(), request.criticality(),
                resolveCategory(request.defaultCategoryId()));
        return ServiceResponse.from(service);
    }

    public ServiceResponse setActive(Long id, boolean active) {
        ITService service = find(id);
        if (active) {
            service.activate();
        } else {
            service.deactivate();
        }
        return ServiceResponse.from(service);
    }

    @Transactional(readOnly = true)
    public ITService find(Long id) {
        return serviceRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Service", id));
    }

    private Category resolveCategory(Long categoryId) {
        return categoryId == null ? null : categoryService.find(categoryId);
    }
}
