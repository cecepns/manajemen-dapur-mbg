USE mbg_multi_dapur;

CREATE TABLE IF NOT EXISTS menu_kitchens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_id INT NOT NULL,
  kitchen_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_menu_kitchen (menu_id, kitchen_id),
  FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
  FOREIGN KEY (kitchen_id) REFERENCES kitchens(id) ON DELETE CASCADE
);

INSERT IGNORE INTO menu_kitchens (menu_id, kitchen_id)
SELECT id, kitchen_id
FROM menus
WHERE kitchen_id IS NOT NULL;
