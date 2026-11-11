package com.itsm.catalog;

import com.itsm.catalog.dto.SkillRequest;
import com.itsm.catalog.dto.SkillResponse;
import com.itsm.common.exception.DuplicateResourceException;
import com.itsm.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository skillRepository;
    private final CategoryService categoryService;

    @Transactional(readOnly = true)
    public List<SkillResponse> list(boolean includeInactive) {
        List<Skill> skills = includeInactive
                ? skillRepository.findAllByOrderByNameAsc()
                : skillRepository.findAllByActiveTrueOrderByNameAsc();
        return skills.stream().map(SkillResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public SkillResponse getById(Long id) {
        return SkillResponse.from(find(id));
    }

    public SkillResponse create(SkillRequest request) {
        if (skillRepository.existsByNameIgnoreCase(request.name().trim())) {
            throw new DuplicateResourceException("A skill named '" + request.name().trim() + "' already exists");
        }
        Skill saved = skillRepository.save(
                new Skill(request.name(), request.description(), categoryService.find(request.categoryId())));
        return SkillResponse.from(saved);
    }

    public SkillResponse update(Long id, SkillRequest request) {
        Skill skill = find(id);
        if (skillRepository.existsByNameIgnoreCaseAndIdNot(request.name().trim(), id)) {
            throw new DuplicateResourceException("A skill named '" + request.name().trim() + "' already exists");
        }
        skill.update(request.name(), request.description(), categoryService.find(request.categoryId()));
        return SkillResponse.from(skill);
    }

    /** Deactivated skills stay on technicians' profiles but are ignored by skill-based assignment. */
    public SkillResponse setActive(Long id, boolean active) {
        Skill skill = find(id);
        if (active) {
            skill.activate();
        } else {
            skill.deactivate();
        }
        return SkillResponse.from(skill);
    }

    @Transactional(readOnly = true)
    public Skill find(Long id) {
        return skillRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Skill", id));
    }
}
